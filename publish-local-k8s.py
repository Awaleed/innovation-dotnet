#!/usr/bin/env python3
"""
Innovation Platform — Local Kubernetes (Kind) Dev Environment.

Builds container images, creates a Kind cluster, and deploys
all services for local Kubernetes testing.

Usage:
    python publish-local-k8s.py            # Build and deploy
    python publish-local-k8s.py --down     # Delete cluster

Requires: pip install pyyaml
           kind, kubectl, docker installed
"""

from __future__ import annotations

import argparse
import os
import pathlib
import shutil
import subprocess
import sys
import textwrap

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install with: pip install pyyaml")
    sys.exit(1)

ROOT = pathlib.Path(__file__).resolve().parent

sys.path.insert(0, str(ROOT))
from publish import generate_password, run, header, info, success, warn


NAMESPACE = "innovation"


def main() -> None:
    parser = argparse.ArgumentParser(description="Innovation Platform — Local K8s Environment")
    parser.add_argument("--image-tag", default="local", help="Image tag (default: local)")
    parser.add_argument("--output", default="dist-local-k8s", help="Output directory")
    parser.add_argument("--cluster-name", default="innovation", help="Kind cluster name")
    parser.add_argument("--down", action="store_true", help="Delete cluster and clean up")
    args = parser.parse_args()

    output = ROOT / args.output
    manifest_dir = output / "manifests"
    web_image = f"innovation-web:{args.image_tag}"
    kc_image = f"innovation-keycloak:{args.image_tag}"

    os.chdir(str(ROOT))

    # --- Down mode ---
    if args.down:
        header(f"Deleting Kind cluster '{args.cluster_name}'")
        run(["kind", "delete", "cluster", "--name", args.cluster_name], check=False)
        if output.exists():
            shutil.rmtree(output, ignore_errors=True)
        success("Cluster deleted.")
        return

    # --- Check prerequisites ---
    for cmd in ("docker", "kubectl", "kind"):
        if not shutil.which(cmd):
            print(f"ERROR: '{cmd}' not found. Install it first.")
            sys.exit(1)

    # --- Build images ---
    header(f"Building web image: {web_image}")
    run([
        "dotnet", "publish", "src/Innovation.Web", "-c", "Release",
        "-p:PublishProfile=DefaultContainer",
        f"-p:ContainerRepository=innovation-web",
        f"-p:ContainerImageTag={args.image_tag}",
    ])

    header(f"Building Keycloak image: {kc_image}")
    kc_build_dir = output / "keycloak-build"
    themes_dir = kc_build_dir / "themes"
    themes_dir.mkdir(parents=True, exist_ok=True)

    # Copy theme JARs
    theme_src = ROOT / "src" / "Innovation.AppHost" / "KeycloakThemes"
    if theme_src.is_dir():
        for f in theme_src.iterdir():
            shutil.copy2(f, themes_dir)

    dockerfile = "FROM quay.io/keycloak/keycloak:26.4\nCOPY themes/ /opt/keycloak/providers/\n"
    (kc_build_dir / "Dockerfile").write_text(dockerfile)
    run(["docker", "build", "-t", kc_image, str(kc_build_dir)])
    success(f"Images built: {web_image}, {kc_image}")

    # --- Create Kind cluster ---
    header(f"Creating Kind cluster '{args.cluster_name}'")
    # Delete existing
    result = subprocess.run(["kind", "get", "clusters"], capture_output=True, text=True)
    if args.cluster_name in (result.stdout or ""):
        info(f"Deleting existing cluster '{args.cluster_name}'...")
        run(["kind", "delete", "cluster", "--name", args.cluster_name])

    kind_config = textwrap.dedent("""\
        kind: Cluster
        apiVersion: kind.x-k8s.io/v1alpha4
        nodes:
          - role: control-plane
            extraPortMappings:
              - containerPort: 30200
                hostPort: 5200
                protocol: TCP
              - containerPort: 30080
                hostPort: 8080
                protocol: TCP
              - containerPort: 30888
                hostPort: 18888
                protocol: TCP
    """)
    kind_config_file = output / "kind-config.yaml"
    kind_config_file.parent.mkdir(parents=True, exist_ok=True)
    kind_config_file.write_text(kind_config)
    run(["kind", "create", "cluster", "--name", args.cluster_name, "--config", str(kind_config_file)])

    # Load images
    info("Loading images into Kind...")
    run(["kind", "load", "docker-image", web_image, "--name", args.cluster_name])
    run(["kind", "load", "docker-image", kc_image, "--name", args.cluster_name])
    success("Cluster created and images loaded.")

    # --- Generate manifests ---
    header("Generating K8s manifests")
    manifest_dir.mkdir(parents=True, exist_ok=True)

    pg_pwd = generate_password()
    redis_pwd = generate_password()
    kc_pwd = generate_password()

    # Copy templates and substitute for local dev
    templates_dir = ROOT / "deploy" / "kubernetes"
    for f in templates_dir.iterdir():
        if not f.is_file():
            continue
        content = f.read_text(encoding="utf-8")

        # Substitute placeholders
        content = content.replace("PG_PWD_PLACEHOLDER", pg_pwd)
        content = content.replace("REDIS_PWD_PLACEHOLDER", redis_pwd)
        content = content.replace("KC_PWD_PLACEHOLDER", kc_pwd)
        content = content.replace("LDAP_PWD_PLACEHOLDER", "adminpassword")
        content = content.replace("KC_IMAGE_PLACEHOLDER", kc_image)
        content = content.replace("WEB_IMAGE_PLACEHOLDER", web_image)

        # Local dev overrides
        content = content.replace("https://AUTH_DOMAIN_PLACEHOLDER", "http://localhost:8080")

        (manifest_dir / f.name).write_text(content, encoding="utf-8")

    # Override services to NodePort for local access
    _patch_services_to_nodeport(manifest_dir, web_image, kc_image)

    # Remove ingress (not needed for local, using NodePort)
    ingress_file = manifest_dir / "40-ingress.yaml"
    if ingress_file.exists():
        ingress_file.unlink()

    # Copy config files for ConfigMaps
    for src_dir in ("keycloak", "ldap", "postgres"):
        src = ROOT / "deploy" / src_dir
        if src.is_dir():
            dst = manifest_dir / src_dir
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)

    success(f"Manifests: {manifest_dir}")

    # --- Apply ---
    header("Applying manifests")
    _apply_manifests(manifest_dir, args.cluster_name)

    print(f"\n{'='*60}")
    print(f"  Local K8s environment ready")
    print(f"{'='*60}")
    print(f"  App:       http://localhost:5200")
    print(f"  Keycloak:  http://localhost:8080")
    print(f"  Dashboard: http://localhost:18888")
    print(f"")
    print(f"  Pods:      kubectl get pods -n {NAMESPACE}")
    print(f"  Logs:      kubectl logs -f -l app=web -n {NAMESPACE}")
    print(f"  Stop:      python publish-local-k8s.py --down")
    print()


def _patch_services_to_nodeport(manifest_dir: pathlib.Path,
                                 web_image: str, kc_image: str) -> None:
    """Patch service manifests for local NodePort access."""
    nodeport_map = {
        "30-web.yaml": {"service_port": 8080, "node_port": 30200},
        "20-keycloak.yaml": {"service_port": 8080, "node_port": 30080},
        "31-dashboard.yaml": {"service_port": 18888, "node_port": 30888},
    }

    for filename, config in nodeport_map.items():
        filepath = manifest_dir / filename
        if not filepath.exists():
            continue

        content = filepath.read_text(encoding="utf-8")
        docs = list(yaml.safe_load_all(content))

        for doc in docs:
            if doc and doc.get("kind") == "Service":
                doc["spec"]["type"] = "NodePort"
                for port in doc["spec"].get("ports", []):
                    if port.get("port") == config["service_port"]:
                        port["nodePort"] = config["node_port"]

            # Set imagePullPolicy: Never for local images
            if doc and doc.get("kind") == "Deployment":
                for container in doc.get("spec", {}).get("template", {}).get("spec", {}).get("containers", []):
                    if container.get("image") in (web_image, kc_image):
                        container["imagePullPolicy"] = "Never"

        # Write back multi-doc YAML
        with open(filepath, "w") as f:
            yaml.dump_all(docs, f, default_flow_style=False, sort_keys=False, width=200)


def _apply_manifests(manifest_dir: pathlib.Path, cluster_name: str) -> None:
    """Apply K8s manifests in order."""
    run(["kubectl", "apply", "-f", str(manifest_dir / "00-namespace.yaml")])
    run(["kubectl", "apply", "-f", str(manifest_dir / "01-secrets.yaml")])

    # Create ConfigMaps from files
    for cm_name, src_file in [
        ("keycloak-realm", "keycloak/realms/innovation.json"),
        ("ldap-seed", "ldap/seed-users.ldif"),
        ("postgres-init", "postgres/init-keycloak.sql"),
    ]:
        src = manifest_dir / src_file
        if src.exists():
            key = src.name
            run(f"kubectl create configmap {cm_name} --from-file={key}={src} -n {NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -")

    # Apply in order
    for f in sorted(manifest_dir.glob("1*.yaml")):
        run(["kubectl", "apply", "-f", str(f)])

    info("Waiting for postgres...")
    run(["kubectl", "wait", "--for=condition=Ready", "pod", "-l", "app=postgres",
         "-n", NAMESPACE, "--timeout=120s"])

    for f in sorted(manifest_dir.glob("[23]*.yaml")):
        run(["kubectl", "apply", "-f", str(f)])

    info("Waiting for keycloak...")
    run(["kubectl", "wait", "--for=condition=Ready", "pod", "-l", "app=keycloak",
         "-n", NAMESPACE, "--timeout=300s"])

    info("Waiting for web...")
    run(["kubectl", "wait", "--for=condition=Ready", "pod", "-l", "app=web",
         "-n", NAMESPACE, "--timeout=180s"])

    success("All pods ready.")


if __name__ == "__main__":
    main()
