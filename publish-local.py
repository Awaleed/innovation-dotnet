#!/usr/bin/env python3
"""
Innovation Platform — Local Docker Compose Dev Environment.

Builds the web app locally and starts all services via Docker Compose.
No registry push, no TLS, dev mode — for developer testing.

Usage:
    python publish-local.py           # Build and start
    python publish-local.py --down    # Stop and clean up

Requires: pip install pyyaml
"""

from __future__ import annotations

import argparse
import os
import pathlib
import shutil
import subprocess
import sys

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML required. Install with: pip install pyyaml")
    sys.exit(1)

# Reuse helpers from publish.py
ROOT = pathlib.Path(__file__).resolve().parent
APPHOST_PROJECT = "src/Innovation.AppHost"

sys.path.insert(0, str(ROOT))
from publish import generate_password, run, header, info, success, warn, _log_config, PHP_CONTEXT


def main() -> None:
    parser = argparse.ArgumentParser(description="Innovation Platform — Local Dev Environment")
    parser.add_argument("--image-tag", default="local", help="Image tag (default: local)")
    parser.add_argument("--output", default="dist-local", help="Output directory (default: dist-local)")
    parser.add_argument("--down", action="store_true", help="Stop and remove containers")
    args = parser.parse_args()

    docker_out = ROOT / args.output / "docker-compose"
    image_name = "innovation-web"
    full_image = f"{image_name}:{args.image_tag}"
    php_image_name = "innovation-php"
    php_full_image = f"{php_image_name}:{args.image_tag}"

    os.chdir(str(ROOT))

    # --- Down mode ---
    if args.down:
        header("Stopping local environment")
        if docker_out.is_dir():
            run(["docker", "compose", "-f", str(docker_out / "docker-compose.yaml"), "down", "-v"], check=False)
            shutil.rmtree(ROOT / args.output, ignore_errors=True)
        success("Local environment stopped.")
        return

    # --- Build ---
    header(f"Building local image: {full_image}")
    run([
        "dotnet", "publish", "src/Innovation.Web", "-c", "Release",
        "-p:PublishProfile=DefaultContainer",
        f"-p:ContainerRepository={image_name}",
        f"-p:ContainerImageTag={args.image_tag}",
    ])
    success(f"Image built: {full_image}")

    # --- Build PHP image ---
    header(f"Building PHP image: {php_full_image}")
    if PHP_CONTEXT.is_dir():
        run(["docker", "build", "-t", php_full_image, "-f", "Dockerfile", "."],
            cwd=str(PHP_CONTEXT))
        success(f"PHP image built: {php_full_image}")
    else:
        warn(f"PHP project not found at {PHP_CONTEXT}, skipping")

    # --- Generate compose via Aspire ---
    header("Generating Docker Compose")
    if docker_out.exists():
        shutil.rmtree(docker_out)
    docker_out.mkdir(parents=True)

    env = {**os.environ, "PUBLISH_TARGET": "docker"}
    run([
        "aspire", "publish",
        "--project", APPHOST_PROJECT,
        "--publisher", "docker",
        "--output-path", str(docker_out),
    ], env=env)

    # --- Transform for local dev ---
    compose_file = docker_out / "docker-compose.yaml"
    with open(compose_file) as f:
        compose = yaml.safe_load(f)

    _transform_local(compose)

    with open(compose_file, "w") as f:
        yaml.dump(compose, f, default_flow_style=False, sort_keys=False, width=200)

    # --- Generate passwords + copy artifacts ---
    passwords = {
        "POSTGRES_PASSWORD": generate_password(),
        "REDIS_PASSWORD": generate_password(),
        "KEYCLOAK_PASSWORD": generate_password(),
        "LDAP_ADMIN_PASSWORD": "adminpassword",  # Match realm JSON default
    }

    # Copy deploy artifacts (including dev realm)
    for src_dir in ("keycloak", "ldap", "postgres"):
        src = ROOT / "deploy" / src_dir
        if src.is_dir():
            dst = docker_out / src_dir
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)

    # Generate .env
    lines = [
        f"WEB_IMAGE={full_image}",
        "WEB_PORT=8080",
        f"PHP_IMAGE={php_full_image}",
        "PHP_PORT=8080",
        "APP_KEY=base64:L8lLlZZp8Ir4N4i5Yi5Htr1sOXYdVBQSTEq1eW5OupU=",
        "KEYCLOAK_PHP_SECRET=innovation-php-secret",
        f"POSTGRES_PASSWORD={passwords['POSTGRES_PASSWORD']}",
        f"REDIS_PASSWORD={passwords['REDIS_PASSWORD']}",
        f"KEYCLOAK_PASSWORD={passwords['KEYCLOAK_PASSWORD']}",
        f"LDAP_ADMIN_PASSWORD={passwords['LDAP_ADMIN_PASSWORD']}",
        "OPENLDAP_BINDMOUNT_0=./ldap",
        "KEYCLOAK_BINDMOUNT_0=./keycloak/realms",
        "KEYCLOAK_BINDMOUNT_1=./keycloak/themes",
    ]
    (docker_out / ".env").write_text("\n".join(lines))

    success(f"Compose artifacts: {docker_out}")

    # --- Start ---
    header("Starting containers")
    run(["docker", "compose", "-f", str(compose_file), "up", "-d"])

    print(f"\n{'='*60}")
    print(f"  Local dev environment ready")
    print(f"{'='*60}")
    print(f"  .NET app:  http://localhost:5200")
    print(f"  PHP app:   http://localhost:8000")
    print(f"  Keycloak:  http://localhost:8080")
    print(f"  Dashboard: http://localhost:18888")
    print(f"")
    print(f"  Logs:      docker compose -f {compose_file} logs -f web")
    print(f"  Stop:      python publish-local.py --down")
    print()


def _transform_local(compose: dict) -> None:
    """Transform Aspire compose for local dev (no Caddy, no TLS, start-dev)."""
    services = compose["services"]

    # --- Dashboard ---
    dash = services.get("innovation-dashboard", {})
    dash["volumes"] = ["dashboard-keys:/home/app/.aspnet/DataProtection-Keys"]

    # --- Redis: AOF + healthcheck + volume ---
    redis = services.get("redis", {})
    if "command" in redis:
        for i, c in enumerate(redis["command"]):
            if isinstance(c, str) and "redis-server --requirepass" in c:
                redis["command"][i] = c.replace(
                    "redis-server --requirepass",
                    "redis-server --appendonly yes --requirepass",
                )
    redis["healthcheck"] = {
        "test": ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"],
        "interval": "10s", "timeout": "3s", "retries": 5,
    }
    redis["volumes"] = ["redis-data:/data"]

    # --- Postgres: POSTGRES_DB + healthcheck + volumes ---
    pg = services.get("postgres", {})
    pg["shm_size"] = "256mb"
    pg["healthcheck"] = {
        "test": ["CMD-SHELL", "pg_isready -U postgres -d innovationdb"],
        "interval": "5s", "timeout": "3s", "retries": 15,
    }
    pg_env = pg.setdefault("environment", {})
    pg_env["POSTGRES_DB"] = "innovationdb"
    pg["volumes"] = [
        "postgres-data:/var/lib/postgresql/data",
        "./postgres/init-keycloak.sql:/docker-entrypoint-initdb.d/01-keycloak.sql:ro",
    ]

    # --- OpenLDAP: data volumes ---
    ldap = services.get("openldap", {})
    existing_vols = ldap.get("volumes", [])
    existing_vols.extend(["ldap-data:/var/lib/ldap", "ldap-config:/etc/ldap/slapd.d"])
    ldap["volumes"] = existing_vols

    # --- phpLDAPadmin ---
    if "phpldapadmin" in services:
        services["phpldapadmin"]["volumes"] = ["phpldapadmin-data:/var/www/phpldapadmin"]

    # --- Keycloak: start-dev + healthcheck + external DB ---
    kc = services.get("keycloak", {})
    if "command" in kc:
        kc["command"] = [
            c.replace("start", "start-dev") if c == "start" else c
            for c in kc["command"]
        ]
    kc_env = kc.setdefault("environment", {})
    kc_env.update({
        "KC_DB": "postgres",
        "KC_DB_URL": "jdbc:postgresql://postgres:5432/keycloakdb",
        "KC_DB_USERNAME": "postgres",
        "KC_DB_PASSWORD": "${POSTGRES_PASSWORD}",
    })
    kc["healthcheck"] = {
        "test": ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/9000"],
        "interval": "5s", "timeout": "3s", "retries": 30, "start_period": "15s",
    }
    kc_deps = kc.setdefault("depends_on", {})
    kc_deps["postgres"] = {"condition": "service_healthy"}

    # --- Web: connection strings + FrontendUrl + port mapping ---
    web = services.get("web", {})
    web_env = web.setdefault("environment", {})
    web_env["ConnectionStrings__keycloak"] = "http://keycloak:8080"
    web_env["Keycloak__FrontendUrl"] = "http://localhost:8080"

    # Expose web on host port 5200
    web["ports"] = ["5200:${WEB_PORT}"]

    # Dependencies: service_started -> service_healthy
    web_deps = web.setdefault("depends_on", {})
    for dep in ("postgres", "keycloak", "redis"):
        if dep in web_deps:
            web_deps[dep] = {"condition": "service_healthy"}

    # --- PHP Legacy App (Laravel) ---
    services.pop("php", None)
    services["php"] = {
        "image": "${PHP_IMAGE}",
        "ports": ["8000:${PHP_PORT}"],
        "environment": {
            "APP_ENV": "local",
            "APP_DEBUG": "true",
            "APP_KEY": "${APP_KEY}",
            "APP_URL": "http://localhost:8000",
            "APP_TIMEZONE": "Asia/Riyadh",
            "APP_LOCALE": "ar",
            "DB_CONNECTION": "pgsql",
            "DB_HOST": "postgres",
            "DB_PORT": "5432",
            "DB_DATABASE": "innovation",
            "DB_USERNAME": "postgres",
            "DB_PASSWORD": "${POSTGRES_PASSWORD}",
            "REDIS_HOST": "redis",
            "REDIS_PORT": "6379",
            "REDIS_PASSWORD": "${REDIS_PASSWORD}",
            "SESSION_DRIVER": "redis",
            "CACHE_STORE": "redis",
            "QUEUE_CONNECTION": "redis",
            "KEYCLOAK_BASE_URL": "http://keycloak:8080",
            "KEYCLOAK_REALM": "innovation",
            "KEYCLOAK_CLIENT_ID": "innovation-php",
            "KEYCLOAK_CLIENT_SECRET": "${KEYCLOAK_PHP_SECRET}",
            "KEYCLOAK_REDIRECT_URI": "http://localhost:8000/sso/callback",
            "CURRENT_THEME": "custom",
        },
        "depends_on": {
            "postgres": {"condition": "service_healthy"},
            "redis": {"condition": "service_healthy"},
            "keycloak": {"condition": "service_healthy"},
        },
    }

    # --- Named volumes ---
    compose["volumes"] = {
        "dashboard-keys": None,
        "phpldapadmin-data": None,
        "postgres-data": None,
        "redis-data": None,
        "ldap-data": None,
        "ldap-config": None,
    }


if __name__ == "__main__":
    main()
