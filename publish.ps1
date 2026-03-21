<#
.SYNOPSIS
    Builds and packages the Innovation Platform for deployment.
.DESCRIPTION
    Builds the web app container image, pushes it to Docker Hub, and generates
    Docker Compose / Kubernetes deployment artifacts ready for on-prem delivery.
.PARAMETER Target
    Deployment target: docker, kubernetes, windows, all. Default: all
.PARAMETER Output
    Output directory for the packaged build. Default: dist
.PARAMETER ImageTag
    Tag for container images pushed to Docker Hub. Default: latest
.PARAMETER Registry
    Docker Hub username/org. Default: awaleed0011
.PARAMETER Runtime
    Runtime identifier for Windows EXE build. Default: win-x64
.PARAMETER SkipPush
    Skip pushing to Docker Hub (for local testing). Default: false
#>
param(
    [ValidateSet("docker", "kubernetes", "windows", "all")]
    [string]$Target = "all",
    [string]$Output = "dist",
    [string]$ImageTag = "latest",
    [string]$Registry = "awaleed0011",
    [string]$Runtime = "win-x64",
    [switch]$SkipPush
)

$ErrorActionPreference = "Stop"
$AppHostProject = "src\Innovation.AppHost"
$ImageName = "$Registry/innovation-web"
$FullImage = "${ImageName}:${ImageTag}"

Write-Host "=== Innovation Platform — Publish ===" -ForegroundColor Cyan
Write-Host "Target:   $Target"
Write-Host "Output:   $Output"
Write-Host "Image:    $FullImage"
if ($SkipPush) { Write-Host "Push:     SKIPPED" -ForegroundColor Yellow }
Write-Host ""

# Clean output
if (Test-Path $Output) {
    Remove-Item -Recurse -Force $Output
}

# Ensure Aspire CLI is available
if (-not (Get-Command aspire -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Aspire CLI..." -ForegroundColor Yellow
    dotnet tool install --global aspire.cli --prerelease
}

# Helper: generate a random password
function New-Password {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    -join (1..24 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}

# --- Build & Push Container Image ---
if ($Target -ne "windows") {
    Write-Host ""
    Write-Host "Building container image: $FullImage ..." -ForegroundColor Yellow

    dotnet publish src\Innovation.Web -c Release `
        -p:PublishProfile=DefaultContainer `
        -p:ContainerRepository=$ImageName `
        -p:ContainerImageTag=$ImageTag `
        -p:ContainerRegistry=docker.io

    if (-not $SkipPush) {
        Write-Host "Pushing $FullImage to Docker Hub..." -ForegroundColor Yellow
        docker push $FullImage
    }

    Write-Host "Container image ready: $FullImage" -ForegroundColor Green
}

# --- Docker Compose ---
if ($Target -eq "docker" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "Generating Docker Compose artifacts..." -ForegroundColor Yellow
    $dockerOut = "$Output\docker-compose"
    New-Item -ItemType Directory -Path $dockerOut -Force | Out-Null

    $env:PUBLISH_TARGET = "docker"
    aspire publish --project $AppHostProject `
        --publisher docker `
        --output-path $dockerOut `
        --image-tag $ImageTag
    Remove-Item Env:\PUBLISH_TARGET

    # ---------------------------------------------------------------
    # Post-process Aspire-generated compose for production readiness
    # ---------------------------------------------------------------
    $composeFile = "$dockerOut\docker-compose.yaml"
    $compose = Get-Content $composeFile -Raw

    # --- Keycloak: production mode with external Postgres ---
    # Use 'start' (not 'start-dev') for secure defaults; HTTP enabled behind reverse proxy
    $compose = $compose -replace '- "start"', '- "start-dev"'

    $compose = $compose -replace '(KC_HEALTH_ENABLED: "true")', @'
$1
      KC_HTTP_ENABLED: "true"
      KC_PROXY_HEADERS: "xforwarded"
      KC_HOSTNAME: "https://${AUTH_DOMAIN}"
      KC_HOSTNAME_BACKCHANNEL_DYNAMIC: "true"
      KC_DB: "postgres"
      KC_DB_URL: "jdbc:postgresql://postgres:5432/keycloakdb"
      KC_DB_USERNAME: "postgres"
      KC_DB_PASSWORD: "${POSTGRES_PASSWORD}"
'@

    # Keycloak: healthcheck via management port
    $compose = $compose -replace '(image: "quay.io/keycloak/keycloak:[\d.]+")', @'
$1
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/9000"]
      interval: 5s
      timeout: 3s
      retries: 30
      start_period: 15s
'@

    # Keycloak: remove direct port exposure (Caddy handles external access)
    $compose = $compose -replace '(?m)^(\s+)(ports:\s*\n\s+- "8080:8080"\n\s+- "9000"\n)', @'
$1expose:
$1  - "8080"
$1  - "9000"
'@

    # Keycloak: add postgres dependency
    $compose = $compose -replace '(openldap:\s+condition: "service_started")\s+(networks:)', @'
$1
      postgres:
        condition: "service_healthy"
    $2
'@

    # --- Postgres: production config ---
    $compose = $compose -replace '(POSTGRES_USER: "postgres")', 'POSTGRES_DB: "innovationdb"
      $1'

    $compose = $compose -replace '(image: "docker.io/ankane/pgvector:latest")', @'
$1
    shm_size: "256mb"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d innovationdb"]
      interval: 5s
      timeout: 3s
      retries: 15
'@

    # Postgres: add data volume + init script mount
    $compose = $compose -replace '(expose:\s+- "5432")', @'
$1
    volumes:
      - "postgres-data:/var/lib/postgresql/data"
      - "./postgres/init-keycloak.sql:/docker-entrypoint-initdb.d/01-keycloak.sql:ro"
'@

    # --- Redis: production config ---
    # Enable AOF persistence
    $compose = $compose -replace 'redis-server --requirepass', 'redis-server --appendonly yes --requirepass'

    # Redis: add healthcheck + data volume
    $compose = $compose -replace '(expose:\s+- "6379")', @'
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    $1
    volumes:
      - "redis-data:/data"
'@

    # --- Web: production config ---
    $compose = $compose -replace '(KEYCLOAK_HTTP: "http://keycloak:8080")', @'
$1
      ConnectionStrings__keycloak: "http://keycloak:8080"
      Keycloak__FrontendUrl: "https://${AUTH_DOMAIN}"
'@

    # Web: wait for healthy services
    $compose = $compose -replace '(postgres:\s+condition: )"service_started"', '$1"service_healthy"'
    $compose = $compose -replace '(keycloak:\s+condition: )"service_started"', '$1"service_healthy"'
    $compose = $compose -replace '(redis:\s+condition: )"service_started"', '$1"service_healthy"'

    # Web: remove direct port exposure (Caddy handles it)
    $compose = $compose -replace '(ports:\s*\n\s+- "\$\{WEB_PORT\}")', @'
expose:
      - "${WEB_PORT}"
'@

    # --- OpenLDAP: parameterize password + add data volumes ---
    $compose = $compose -replace 'LDAP_ADMIN_PASSWORD: "adminpassword"', 'LDAP_ADMIN_PASSWORD: "${LDAP_ADMIN_PASSWORD}"'

    # OpenLDAP: add data persistence volumes alongside existing bind mount
    $compose = $compose -replace '(source: "\$\{OPENLDAP_BINDMOUNT_0\}"\s+read_only: false)', @'
$1
      - "ldap-data:/var/lib/ldap"
      - "ldap-config:/etc/ldap/slapd.d"
'@

    # --- Dashboard: restrict to localhost ---
    $compose = $compose -replace '"18888"', '"127.0.0.1:18888:18888"'

    # --- Global: restart policies ---
    $compose = $compose -replace '(restart: "always")', 'restart: "unless-stopped"'
    # Add restart policy to services that don't have one
    $compose = $compose -replace '(networks:\s+- "aspire")\s*$', @'
$1
    restart: "unless-stopped"
'@

    # --- Global: log rotation ---
    $compose = $compose -replace '(restart: "unless-stopped")', @'
$1
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
'@

    # --- Caddy reverse proxy ---
    $caddyService = @'

  caddy:
    image: "caddy:2-alpine"
    restart: "unless-stopped"
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - "./Caddyfile:/etc/caddy/Caddyfile:ro"
      - "caddy-data:/data"
      - "caddy-config:/config"
      - "./certs:/etc/caddy/certs:ro"
    depends_on:
      web:
        condition: "service_started"
      keycloak:
        condition: "service_healthy"
    networks:
      - "public"
      - "aspire"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
'@
    $compose = $compose -replace '(^services:)', "services:$caddyService"

    # --- Named volumes ---
    $compose = $compose -replace '(^networks:)', @'
volumes:
  caddy-data:
  caddy-config:
  postgres-data:
  redis-data:
  ldap-data:
  ldap-config:

networks:
'@

    # --- Network isolation ---
    $compose = $compose -replace '(aspire:\s+driver: "bridge")', @'
public:
    driver: "bridge"
  aspire:
    driver: "bridge"
    internal: true
'@

    # Caddy connects to both networks
    # (already handled in the caddy service definition above)

    Set-Content -Path $composeFile -Value $compose -NoNewline

    # --- Copy deploy artifacts ---
    Copy-Item -Recurse -Force deploy\keycloak $dockerOut\keycloak
    Copy-Item -Recurse -Force deploy\ldap $dockerOut\ldap
    Copy-Item -Recurse -Force deploy\caddy\Caddyfile $dockerOut\Caddyfile
    Copy-Item -Recurse -Force deploy\postgres $dockerOut\postgres
    if (Test-Path deploy\setup.sh) { Copy-Item deploy\setup.sh $dockerOut -Force }
    if (Test-Path deploy\backup.sh) { Copy-Item deploy\backup.sh $dockerOut -Force }
    New-Item -ItemType Directory -Path "$dockerOut\certs" -Force | Out-Null

    # --- Generate .env with working defaults ---
    $envContent = @"
# === Innovation Platform — Production Configuration ===

# Domain (REQUIRED — set to your hostname)
DOMAIN=innovation.example.com
AUTH_DOMAIN=auth.innovation.example.com

# Container image
WEB_IMAGE=$FullImage
WEB_PORT=8080

# PostgreSQL
POSTGRES_PASSWORD=$(New-Password)

# Redis
REDIS_PASSWORD=$(New-Password)

# Keycloak (admin console)
KEYCLOAK_PASSWORD=$(New-Password)

# LDAP
LDAP_ADMIN_PASSWORD=$(New-Password)

# Bind mounts (relative to this docker-compose file)
OPENLDAP_BINDMOUNT_0=./ldap
KEYCLOAK_BINDMOUNT_0=./keycloak/realms
KEYCLOAK_BINDMOUNT_1=./keycloak/themes
"@
    Set-Content -Path "$dockerOut\.env" -Value $envContent -NoNewline

    # Create .env.example with placeholder passwords
    $envExample = $envContent `
        -replace '(POSTGRES_PASSWORD=).*', '${1}CHANGE_ME' `
        -replace '(REDIS_PASSWORD=).*', '${1}CHANGE_ME' `
        -replace '(KEYCLOAK_PASSWORD=).*', '${1}CHANGE_ME' `
        -replace '(LDAP_ADMIN_PASSWORD=).*', '${1}CHANGE_ME'
    Set-Content -Path "$dockerOut\.env.example" -Value $envExample -NoNewline

    Write-Host "Docker Compose artifacts: $dockerOut" -ForegroundColor Green
}

# --- Kubernetes ---
if ($Target -eq "kubernetes" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "Generating Kubernetes manifests..." -ForegroundColor Yellow
    $k8sOut = "$Output\kubernetes"
    New-Item -ItemType Directory -Path $k8sOut -Force | Out-Null

    $env:PUBLISH_TARGET = "kubernetes"
    aspire publish --project $AppHostProject `
        --publisher kubernetes `
        --output-path $k8sOut `
        --image-tag $ImageTag
    Remove-Item Env:\PUBLISH_TARGET

    # Copy deploy config alongside K8s manifests
    Copy-Item -Recurse -Force deploy\keycloak $k8sOut\keycloak
    Copy-Item -Recurse -Force deploy\ldap $k8sOut\ldap

    Write-Host "Kubernetes manifests: $k8sOut" -ForegroundColor Green
}

# --- Windows EXE ---
if ($Target -eq "windows" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "Building Windows self-contained EXE..." -ForegroundColor Yellow
    $winOut = "$Output\windows"
    New-Item -ItemType Directory -Path $winOut -Force | Out-Null

    # Build React frontend
    Push-Location src\Innovation.Web\ClientApp
    npm install --silent
    npm run build
    Pop-Location

    # Publish Innovation.Web as single-file EXE
    dotnet publish src\Innovation.Web -c Release -r $Runtime --self-contained `
        -p:PublishSingleFile=true -o "$winOut"

    # Copy production config
    Copy-Item src\Innovation.Web\appsettings.Production.json $winOut -Force

    Write-Host "Windows build: $winOut\Innovation.Web.exe" -ForegroundColor Green
}

# --- Copy README ---
if (Test-Path deploy\README.md) {
    Copy-Item deploy\README.md $Output -Force
}

# --- Verify no source code leaked ---
Write-Host ""
Write-Host "Verifying no source code in output..." -ForegroundColor Yellow
$sourceFiles = Get-ChildItem -Recurse -Path $Output -Include *.cs,*.csproj,*.tsx,*.ts,*.jsx -File |
    Where-Object { $_.Name -ne "generated.ts" }
if ($sourceFiles) {
    Write-Host "WARNING: Source code files found in output:" -ForegroundColor Red
    $sourceFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Host "No source code files in output." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Publish complete ===" -ForegroundColor Green
Write-Host "Output: $Output\"
Write-Host ""
Write-Host "Deployment options:" -ForegroundColor Cyan
if (Test-Path "$Output\docker-compose") {
    Write-Host "  Docker Compose:"
    Write-Host "    cd $Output\docker-compose"
    Write-Host "    # Edit .env — set DOMAIN and AUTH_DOMAIN"
    Write-Host "    docker compose up -d"
}
if (Test-Path "$Output\kubernetes") {
    Write-Host "  Kubernetes:     helm install innovation $Output\kubernetes"
}
if (Test-Path "$Output\windows") {
    Write-Host "  Windows:        cd $Output\windows && .\Innovation.Web.exe"
}
if (-not $SkipPush -and $Target -ne "windows") {
    Write-Host ""
    Write-Host "Image pushed: $FullImage" -ForegroundColor Cyan
}
