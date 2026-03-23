#!/usr/bin/env python3
"""
Innovation Platform — Build & Package Script.

Builds the web app container image, pushes it to Docker Hub, and generates
Docker Compose / Kubernetes deployment artifacts ready for on-prem delivery.

Usage:
    python publish.py --target docker --skip-push
    python publish.py --target kubernetes --image-tag v1.0.6
    python publish.py --target all --skip-push
    python publish.py --target windows

Requires: pip install pyyaml
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import random
import shutil
import string
import subprocess
import sys

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML is required. Install with: pip install pyyaml")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ROOT = pathlib.Path(__file__).resolve().parent
APPHOST_PROJECT = "src/Innovation.AppHost"
PHP_CONTEXT = ROOT.parent / "innovation"  # Sibling directory


def generate_password(length: int = 24) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))


def run(cmd: str | list[str], *, check: bool = True, cwd: str | None = None,
        env: dict | None = None) -> subprocess.CompletedProcess:
    merged_env = {**os.environ, **(env or {})}
    display = " ".join(cmd) if isinstance(cmd, list) else cmd
    print(f"  > {display}")
    return subprocess.run(
        cmd, shell=isinstance(cmd, str), check=check, cwd=cwd, env=merged_env,
    )


def header(msg: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def info(msg: str) -> None:
    print(f"  {msg}")


def success(msg: str) -> None:
    print(f"  [OK] {msg}")


def warn(msg: str) -> None:
    print(f"  [WARN] {msg}")


# ---------------------------------------------------------------------------
# Build & Push
# ---------------------------------------------------------------------------

def build_container_image(full_image: str, image_name: str, image_tag: str,
                          skip_push: bool) -> None:
    header(f"Building container image: {full_image}")

    # dotnet publish with ContainerRegistry pushes directly to the registry.
    # Without ContainerRegistry, the image is built locally only.
    cmd = [
        "dotnet", "publish", "src/Innovation.Web", "-c", "Release",
        f"-p:PublishProfile=DefaultContainer",
        f"-p:ContainerRepository={image_name}",
        f"-p:ContainerImageTag={image_tag}",
    ]
    if not skip_push:
        cmd.append("-p:ContainerRegistry=docker.io")
        info(f"Building and pushing {full_image} to Docker Hub...")
    else:
        info("Building image locally (skip push)...")

    run(cmd)
    success(f"Container image ready: {full_image}")


def build_php_image(full_image: str, skip_push: bool) -> None:
    """Build the PHP Laravel production image."""
    header(f"Building PHP image: {full_image}")

    if not PHP_CONTEXT.is_dir():
        warn(f"PHP project not found at {PHP_CONTEXT}, skipping PHP image build")
        return

    run(["docker", "build", "-t", full_image, "-f", "Dockerfile", "."],
        cwd=str(PHP_CONTEXT))

    if not skip_push:
        info(f"Pushing {full_image} to registry...")
        run(["docker", "push", full_image])

    success(f"PHP image ready: {full_image}")


# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------

def generate_docker_compose(output: pathlib.Path, full_image: str,
                            php_image: str = "") -> None:
    header("Generating Docker Compose artifacts")
    docker_out = output / "docker-compose"
    docker_out.mkdir(parents=True, exist_ok=True)

    # 1. Run Aspire publish to generate base compose
    env = {**os.environ, "PUBLISH_TARGET": "docker"}
    run([
        "aspire", "publish",
        "--project", APPHOST_PROJECT,
        "--publisher", "docker",
        "--output-path", str(docker_out),
    ], env=env)

    # 2. Load and transform with PyYAML
    compose_file = docker_out / "docker-compose.yaml"
    with open(compose_file, "r") as f:
        compose = yaml.safe_load(f)

    _transform_compose(compose)

    # 3. Write back
    with open(compose_file, "w") as f:
        yaml.dump(compose, f, default_flow_style=False, sort_keys=False, width=200)

    # 4. Generate passwords (needed by both artifact copy and .env)
    passwords = {
        "POSTGRES_PASSWORD": generate_password(),
        "REDIS_PASSWORD": generate_password(),
        "KEYCLOAK_PASSWORD": generate_password(),
        "LDAP_ADMIN_PASSWORD": generate_password(),
    }

    # 5. Copy deploy artifacts + inject LDAP password into realm JSON
    _copy_deploy_artifacts(docker_out, passwords)

    # 6. Generate .env
    _generate_env(docker_out, full_image, passwords, php_image)

    success(f"Docker Compose artifacts: {docker_out}")


def _transform_compose(compose: dict) -> None:
    """Apply all production transforms to the Aspire-generated compose dict."""
    services = compose["services"]

    # --- Caddy reverse proxy ---
    services["caddy"] = {
        "image": "caddy:2-alpine",
        "restart": "unless-stopped",
        "ports": ["80:80", "443:443", "443:443/udp"],
        "environment": {
            "DOMAIN": "${DOMAIN}",
            "AUTH_DOMAIN": "${AUTH_DOMAIN}",
            "WEB_PORT": "8080",
            "PHP_PORT": "8080",
        },
        "volumes": [
            "./Caddyfile:/etc/caddy/Caddyfile:ro",
            "caddy-data:/data",
            "caddy-config:/config",
            "./certs:/etc/caddy/certs:ro",
        ],
        "depends_on": {
            "web": {"condition": "service_started"},
            "keycloak": {"condition": "service_healthy"},
        },
        "networks": ["public", "aspire"],
        "logging": _log_config(),
    }

    # --- Dashboard: restrict to localhost, pin anonymous volume ---
    dash = services.get("innovation-dashboard", {})
    dash["ports"] = ["127.0.0.1:18888:18888"]
    dash["volumes"] = ["dashboard-keys:/home/app/.aspnet/DataProtection-Keys"]
    dash["restart"] = "unless-stopped"
    dash["logging"] = _log_config()

    # --- Redis: AOF + healthcheck + volume ---
    redis = services["redis"]
    # Fix command for AOF persistence
    if "command" in redis:
        for i, c in enumerate(redis["command"]):
            if isinstance(c, str) and "redis-server --requirepass" in c:
                redis["command"][i] = c.replace(
                    "redis-server --requirepass",
                    "redis-server --appendonly yes --requirepass",
                )
    redis["healthcheck"] = {
        "test": ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"],
        "interval": "10s",
        "timeout": "3s",
        "retries": 5,
    }
    redis["volumes"] = ["redis-data:/data"]
    redis["restart"] = "unless-stopped"
    redis["logging"] = _log_config()

    # --- Postgres: POSTGRES_DB + healthcheck + shm_size + volumes ---
    pg = services["postgres"]
    pg["shm_size"] = "256mb"
    pg["healthcheck"] = {
        "test": ["CMD-SHELL", "pg_isready -U postgres -d innovationdb"],
        "interval": "5s",
        "timeout": "3s",
        "retries": 15,
    }
    pg_env = pg.setdefault("environment", {})
    pg_env["POSTGRES_DB"] = "innovationdb"
    pg["volumes"] = [
        "postgres-data:/var/lib/postgresql/data",
        "./postgres/init-keycloak.sql:/docker-entrypoint-initdb.d/01-keycloak.sql:ro",
    ]
    pg["restart"] = "unless-stopped"
    pg["logging"] = _log_config()

    # --- OpenLDAP: parameterize password + data volumes ---
    ldap = services["openldap"]
    ldap_env = ldap.setdefault("environment", {})
    ldap_env["LDAP_ADMIN_PASSWORD"] = "${LDAP_ADMIN_PASSWORD}"
    existing_vols = ldap.get("volumes", [])
    existing_vols.extend([
        "ldap-data:/var/lib/ldap",
        "ldap-config:/etc/ldap/slapd.d",
    ])
    ldap["volumes"] = existing_vols
    ldap["restart"] = "unless-stopped"
    ldap["logging"] = _log_config()

    # --- phpLDAPadmin: pin anonymous volume ---
    if "phpldapadmin" in services:
        services["phpldapadmin"]["volumes"] = ["phpldapadmin-data:/var/www/phpldapadmin"]
        services["phpldapadmin"]["restart"] = "unless-stopped"
        services["phpldapadmin"]["logging"] = _log_config()

    # --- Keycloak: production mode + env + healthcheck + external DB ---
    kc = services["keycloak"]
    # Keep Aspire's default 'start' (production mode) — Caddy handles TLS
    kc_env = kc.setdefault("environment", {})
    kc_env.update({
        "KC_HTTP_ENABLED": "true",
        "KC_PROXY_HEADERS": "xforwarded",
        "KC_HOSTNAME": "https://${AUTH_DOMAIN}",
        "KC_HOSTNAME_BACKCHANNEL_DYNAMIC": "true",
        "KC_DB": "postgres",
        "KC_DB_URL": "jdbc:postgresql://postgres:5432/keycloakdb",
        "KC_DB_USERNAME": "postgres",
        "KC_DB_PASSWORD": "${POSTGRES_PASSWORD}",
    })
    kc["healthcheck"] = {
        "test": ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/9000"],
        "interval": "5s",
        "timeout": "3s",
        "retries": 30,
        "start_period": "15s",
    }
    # ports -> expose
    if "ports" in kc:
        kc["expose"] = ["8080", "9000"]
        del kc["ports"]
    # Add postgres dependency
    kc_deps = kc.setdefault("depends_on", {})
    kc_deps["postgres"] = {"condition": "service_healthy"}
    kc["restart"] = "unless-stopped"
    kc["logging"] = _log_config()

    # --- Web: connection strings + frontend URL + expose ---
    web = services["web"]
    web_env = web.setdefault("environment", {})
    web_env["ConnectionStrings__keycloak"] = "http://keycloak:8080"
    web_env["Keycloak__FrontendUrl"] = "https://${AUTH_DOMAIN}"
    # ports -> expose
    if "ports" in web:
        web["expose"] = ["8080"]
        del web["ports"]
    # Dependencies: service_started -> service_healthy
    web_deps = web.setdefault("depends_on", {})
    for dep in ("postgres", "keycloak", "redis"):
        if dep in web_deps:
            web_deps[dep] = {"condition": "service_healthy"}
    web["restart"] = "unless-stopped"
    web["logging"] = _log_config()

    # --- PHP Legacy App (Laravel) ---
    # All values from .env with PHP_ prefix → mapped to Laravel env var names
    services.pop("php", None)
    services["php"] = {
        "image": "${PHP_IMAGE}",
        "restart": "unless-stopped",
        "expose": ["8080"],
        "volumes": [
            "./php-config/trustedproxy.php:/var/www/html/config/trustedproxy.php:ro",
        ],
        "environment": {
            "APP_ENV": "${PHP_APP_ENV}",
            "APP_DEBUG": "${PHP_APP_DEBUG}",
            "APP_KEY": "${PHP_APP_KEY}",
            "APP_NAME": "${PHP_APP_NAME}",
            "APP_URL": "${PHP_APP_URL}",
            "APP_TIMEZONE": "${PHP_APP_TIMEZONE}",
            "APP_LOCALE": "${PHP_APP_LOCALE}",
            "DB_CONNECTION": "${PHP_DB_CONNECTION}",
            "DB_HOST": "${PHP_DB_HOST}",
            "DB_PORT": "${PHP_DB_PORT}",
            "DB_DATABASE": "${PHP_DB_DATABASE}",
            "DB_USERNAME": "${PHP_DB_USERNAME}",
            "DB_PASSWORD": "${POSTGRES_PASSWORD}",
            "REDIS_HOST": "redis",
            "REDIS_PORT": "6379",
            "REDIS_PASSWORD": "${REDIS_PASSWORD}",
            "SESSION_DRIVER": "${PHP_SESSION_DRIVER}",
            "CACHE_STORE": "${PHP_CACHE_STORE}",
            "QUEUE_CONNECTION": "${PHP_QUEUE_CONNECTION}",
            "KEYCLOAK_BASE_URL": "${PHP_KEYCLOAK_BASE_URL}",
            "KEYCLOAK_BASE_URL_INTERNAL": "${PHP_KEYCLOAK_BASE_URL_INTERNAL}",
            "KEYCLOAK_REALM": "${PHP_KEYCLOAK_REALM}",
            "KEYCLOAK_CLIENT_ID": "${PHP_KEYCLOAK_CLIENT_ID}",
            "KEYCLOAK_CLIENT_SECRET": "${PHP_KEYCLOAK_CLIENT_SECRET}",
            "KEYCLOAK_REDIRECT_URI": "${PHP_KEYCLOAK_REDIRECT_URI}",
            "CURRENT_THEME": "${PHP_CURRENT_THEME}",
            "OPENAI_API_KEY": "${PHP_OPENAI_API_KEY}",
            "TELESCOPE_ENABLED": "${PHP_TELESCOPE_ENABLED}",
            "ABLY_KEY": "${PHP_ABLY_KEY}",
            "ABLY_PUBLIC_KEY": "${PHP_ABLY_PUBLIC_KEY}",
            "FORECASTING_ENABLED": "${PHP_FORECASTING_ENABLED}",
            "TRUSTED_PROXIES": "*",
        },
        "depends_on": {
            "postgres": {"condition": "service_healthy"},
            "redis": {"condition": "service_healthy"},
            "keycloak": {"condition": "service_healthy"},
        },
        "networks": ["aspire"],
        "logging": _log_config(),
    }

    # Add PHP to Caddy dependencies
    caddy_deps = services["caddy"].setdefault("depends_on", {})
    caddy_deps["php"] = {"condition": "service_started"}

    # --- Named volumes ---
    compose["volumes"] = {
        "caddy-data": None,
        "caddy-config": None,
        "dashboard-keys": None,
        "phpldapadmin-data": None,
        "postgres-data": None,
        "redis-data": None,
        "ldap-data": None,
        "ldap-config": None,
    }

    # --- Network isolation ---
    compose["networks"] = {
        "public": {"driver": "bridge"},
        "aspire": {"driver": "bridge", "internal": True},
    }


def _log_config() -> dict:
    return {
        "driver": "json-file",
        "options": {"max-size": "10m", "max-file": "5"},
    }


def _transform_realm_for_production(realm_file: pathlib.Path) -> None:
    """Transform Keycloak realm JSON for production deployment.

    - Adds https://${DOMAIN} redirect URIs alongside localhost dev URIs
    - Updates backchannel logout URLs to use Docker service names
    - Updates post-logout redirect URIs
    """
    DOMAIN = "innovation.test"  # Placeholder — operator sets real domain in .env
    content = realm_file.read_text(encoding="utf-8")
    realm = json.loads(content)

    for client in realm.get("clients", []):
        client_id = client.get("clientId", "")

        if client_id == "innovation-web":
            # Add production redirect URIs
            client["redirectUris"] = [
                "http://localhost:5200/*",
                "https://localhost:7200/*",
                f"https://{DOMAIN}/*",
            ]
            client["webOrigins"] = [
                "http://localhost:5200",
                "https://localhost:7200",
                f"https://{DOMAIN}",
            ]
            attrs = client.setdefault("attributes", {})
            attrs["post.logout.redirect.uris"] = (
                f"http://localhost:5200/*##https://localhost:7200/*##https://{DOMAIN}/*"
            )
            attrs["backchannel.logout.url"] = "http://web:8080/auth/backchannel-logout"

        elif client_id == "innovation-php":
            client["redirectUris"] = [
                "http://localhost:8000/*",
                f"https://{DOMAIN}/*",
            ]
            client["webOrigins"] = [
                "http://localhost:8000",
                f"https://{DOMAIN}",
            ]
            attrs = client.setdefault("attributes", {})
            attrs["post.logout.redirect.uris"] = f"https://{DOMAIN}/*"
            attrs["backchannel.logout.url"] = "http://php:8080/sso/backchannel-logout"

    realm_file.write_text(json.dumps(realm, indent=2, ensure_ascii=False), encoding="utf-8")


def _copy_deploy_artifacts(docker_out: pathlib.Path, passwords: dict) -> None:
    """Copy deploy config files alongside compose, injecting secrets."""
    for src_dir in ("keycloak", "ldap", "postgres"):
        src = ROOT / "deploy" / src_dir
        if src.is_dir():
            dst = docker_out / src_dir
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)

    # Remove dev realm files (only production realm should be deployed)
    for dev_file in (docker_out / "keycloak" / "realms").glob("*.dev.json"):
        dev_file.unlink()

    # Inject LDAP password into realm JSON (replace hardcoded bindCredential)
    for realm_file in (docker_out / "keycloak" / "realms").glob("*.json"):
        content = realm_file.read_text(encoding="utf-8")
        if '"adminpassword"' in content:
            content = content.replace('"adminpassword"', f'"{passwords["LDAP_ADMIN_PASSWORD"]}"')
            realm_file.write_text(content, encoding="utf-8")

    # Transform Keycloak realm JSON for production (Docker service names + domain URIs)
    for realm_file in (docker_out / "keycloak" / "realms").glob("*.json"):
        _transform_realm_for_production(realm_file)

    # PHP TrustedProxies config (Laravel needs this behind reverse proxy)
    php_config_dir = docker_out / "php-config"
    php_config_dir.mkdir(exist_ok=True)
    (php_config_dir / "trustedproxy.php").write_text(
        "<?php\n\nreturn [\n    'proxies' => '*',\n];\n"
    )

    # Caddyfile
    caddy_src = ROOT / "deploy" / "caddy" / "Caddyfile"
    if caddy_src.exists():
        shutil.copy2(caddy_src, docker_out / "Caddyfile")

    # Scripts
    for script in ("setup.sh", "backup.sh"):
        src = ROOT / "deploy" / script
        if src.exists():
            shutil.copy2(src, docker_out / script)

    # Certs directory
    (docker_out / "certs").mkdir(exist_ok=True)


def _generate_env(docker_out: pathlib.Path, full_image: str,
                  passwords: dict, php_image: str = "") -> None:
    """Generate .env and .env.example files."""
    lines = [
        "# === Innovation Platform — Production Configuration ===",
        "",
        "# Domain — set to your hostname",
        "DOMAIN=innovation.test",
        "AUTH_DOMAIN=auth.innovation.test",
        "",
        "# Container images",
        f"WEB_IMAGE={full_image}",
        f"PHP_IMAGE={php_image}",
        "WEB_PORT=8080",
        "",
        "# Generated passwords (shared across services)",
        f"POSTGRES_PASSWORD={passwords['POSTGRES_PASSWORD']}",
        f"REDIS_PASSWORD={passwords['REDIS_PASSWORD']}",
        f"KEYCLOAK_PASSWORD={passwords['KEYCLOAK_PASSWORD']}",
        f"LDAP_ADMIN_PASSWORD={passwords['LDAP_ADMIN_PASSWORD']}",
        "",
        "# PHP — app",
        "PHP_APP_ENV=production",
        "PHP_APP_DEBUG=false",
        "PHP_APP_KEY=base64:CHANGE_ME_GENERATE_WITH_PHP_ARTISAN_KEY_GENERATE",
        "PHP_APP_NAME=Innovation Lab",
        "PHP_APP_URL=https://innovation.test",
        "PHP_APP_TIMEZONE=Asia/Riyadh",
        "PHP_APP_LOCALE=ar",
        "",
        "# PHP — database",
        "PHP_DB_CONNECTION=pgsql",
        "PHP_DB_HOST=postgres",
        "PHP_DB_PORT=5432",
        "PHP_DB_DATABASE=innovation",
        "PHP_DB_USERNAME=postgres",
        "",
        "# PHP — session/cache/queue",
        "PHP_SESSION_DRIVER=redis",
        "PHP_CACHE_STORE=redis",
        "PHP_QUEUE_CONNECTION=redis",
        "",
        "# PHP — keycloak SSO",
        "PHP_KEYCLOAK_BASE_URL=https://auth.innovation.test",
        "PHP_KEYCLOAK_BASE_URL_INTERNAL=http://keycloak:8080",
        "PHP_KEYCLOAK_REALM=innovation",
        "PHP_KEYCLOAK_CLIENT_ID=innovation-php",
        "PHP_KEYCLOAK_CLIENT_SECRET=innovation-php-secret",
        "PHP_KEYCLOAK_REDIRECT_URI=https://innovation.test/sso/callback",
        "",
        "# PHP — services",
        "PHP_OPENAI_API_KEY=sk-not-configured",
        "PHP_TELESCOPE_ENABLED=false",
        "PHP_CURRENT_THEME=custom",
        "PHP_FORECASTING_ENABLED=true",
        "PHP_ABLY_KEY=",
        "PHP_ABLY_PUBLIC_KEY=",
        "",
        "# Bind mounts",
        "OPENLDAP_BINDMOUNT_0=./ldap",
        "KEYCLOAK_BINDMOUNT_0=./keycloak/realms",
        "KEYCLOAK_BINDMOUNT_1=./keycloak/themes",
    ]

    env_content = "\n".join(lines)
    (docker_out / ".env").write_text(env_content)

    # .env.example with placeholders
    example = env_content
    for key in passwords:
        example = example.replace(f"{key}={passwords[key]}", f"{key}=CHANGE_ME")
    (docker_out / ".env.example").write_text(example)


# ---------------------------------------------------------------------------
# Kubernetes
# ---------------------------------------------------------------------------

def generate_kubernetes(output: pathlib.Path, full_image: str, registry: str,
                        image_tag: str, php_image: str = "") -> None:
    header("Generating Kubernetes manifests")
    k8s_out = output / "kubernetes"
    k8s_out.mkdir(parents=True, exist_ok=True)

    kc_image = f"{registry}/innovation-keycloak:{image_tag}"
    passwords = {
        "PG_PWD_PLACEHOLDER": generate_password(),
        "REDIS_PWD_PLACEHOLDER": generate_password(),
        "KC_PWD_PLACEHOLDER": generate_password(),
        "LDAP_PWD_PLACEHOLDER": generate_password(),
    }

    # Copy templates and substitute placeholders
    templates_dir = ROOT / "deploy" / "kubernetes"
    if not templates_dir.is_dir():
        warn(f"No K8s templates found at {templates_dir}")
        return

    for f in templates_dir.iterdir():
        content = f.read_text(encoding="utf-8")
        # Substitute all placeholders
        for placeholder, value in passwords.items():
            content = content.replace(placeholder, value)
        content = content.replace("KC_IMAGE_PLACEHOLDER", kc_image)
        content = content.replace("WEB_IMAGE_PLACEHOLDER", full_image)
        content = content.replace("PHP_IMAGE_PLACEHOLDER", php_image)
        (k8s_out / f.name).write_text(content, encoding="utf-8")

    # Copy config files for ConfigMaps
    for src_dir in ("keycloak", "ldap", "postgres"):
        src = ROOT / "deploy" / src_dir
        if src.is_dir():
            dst = k8s_out / src_dir
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)

    success(f"Kubernetes manifests: {k8s_out}")


# ---------------------------------------------------------------------------
# Windows EXE
# ---------------------------------------------------------------------------

def build_windows_exe(output: pathlib.Path, runtime: str) -> None:
    header("Building Windows self-contained EXE")
    win_out = output / "windows"
    win_out.mkdir(parents=True, exist_ok=True)

    # Build React frontend
    client_dir = ROOT / "src" / "Innovation.Web" / "ClientApp"
    run(["npm", "install", "--silent"], cwd=str(client_dir))
    run(["npm", "run", "build"], cwd=str(client_dir))

    # Publish .NET
    run([
        "dotnet", "publish", "src/Innovation.Web",
        "-c", "Release", "-r", runtime, "--self-contained",
        "-p:PublishSingleFile=true", "-o", str(win_out),
    ])

    # Copy production config
    prod_config = ROOT / "src" / "Innovation.Web" / "appsettings.Production.json"
    if prod_config.exists():
        shutil.copy2(prod_config, win_out)

    success(f"Windows build: {win_out / 'Innovation.Web.exe'}")


# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------

def verify_no_source_leak(output: pathlib.Path) -> None:
    info("Verifying no source code in output...")
    source_exts = {".cs", ".csproj", ".tsx", ".ts", ".jsx"}
    leaked = []
    for f in output.rglob("*"):
        if f.is_file() and f.suffix in source_exts and f.name != "generated.ts":
            leaked.append(f)
    if leaked:
        warn("Source code files found in output:")
        for f in leaked:
            warn(f"  {f}")
    else:
        success("No source code files in output.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Innovation Platform — Build & Package",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--target", choices=["docker", "kubernetes", "windows", "all"],
                        default="all", help="Deployment target (default: all)")
    parser.add_argument("--output", default="dist", help="Output directory (default: dist)")
    parser.add_argument("--image-tag", default="latest", help="Container image tag (default: latest)")
    parser.add_argument("--registry", default="awaleed0011", help="Docker Hub registry (default: awaleed0011)")
    parser.add_argument("--runtime", default="win-x64", help="Windows runtime ID (default: win-x64)")
    parser.add_argument("--skip-push", action="store_true", help="Skip pushing to Docker Hub")

    args = parser.parse_args()
    image_name = f"{args.registry}/innovation-web"
    full_image = f"{image_name}:{args.image_tag}"
    php_image_name = f"{args.registry}/innovation-php"
    php_full_image = f"{php_image_name}:{args.image_tag}"
    output = ROOT / args.output

    print(f"\n{'='*60}")
    print(f"  Innovation Platform — Publish")
    print(f"{'='*60}")
    print(f"  Target:    {args.target}")
    print(f"  Output:    {output}")
    print(f"  .NET img:  {full_image}")
    print(f"  PHP img:   {php_full_image}")
    if args.skip_push:
        print(f"  Push:      SKIPPED")

    # Clean output
    if output.exists():
        try:
            shutil.rmtree(output)
        except PermissionError:
            warn(f"Could not fully clean {output} (files may be locked by Docker).")
            warn("Continuing with overwrite...")

    # Ensure aspire CLI
    os.chdir(str(ROOT))

    # Build container images
    if args.target != "windows":
        build_container_image(full_image, image_name, args.image_tag, args.skip_push)
        build_php_image(php_full_image, args.skip_push)

    # Generate targets
    if args.target in ("docker", "all"):
        generate_docker_compose(output, full_image, php_full_image)

    if args.target in ("kubernetes", "all"):
        generate_kubernetes(output, full_image, args.registry, args.image_tag, php_full_image)

    if args.target in ("windows", "all"):
        build_windows_exe(output, args.runtime)

    # Copy README
    readme = ROOT / "deploy" / "README.md"
    if readme.exists():
        shutil.copy2(readme, output)

    # Verify
    verify_no_source_leak(output)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Publish complete — {output}/")
    print(f"{'='*60}")
    if (output / "docker-compose").is_dir():
        print(f"  Docker Compose:")
        print(f"    cd {output}/docker-compose")
        print(f"    # Edit .env — set DOMAIN and AUTH_DOMAIN")
        print(f"    docker compose up -d")
    if (output / "kubernetes").is_dir():
        print(f"  Kubernetes:")
        print(f"    cd {output}/kubernetes")
        print(f"    # Replace DOMAIN_PLACEHOLDER/AUTH_DOMAIN_PLACEHOLDER in manifests")
        print(f"    bash deploy.sh")
    if (output / "windows").is_dir():
        print(f"  Windows:")
        print(f"    cd {output}/windows && .\\Innovation.Web.exe")
    print()


if __name__ == "__main__":
    main()
