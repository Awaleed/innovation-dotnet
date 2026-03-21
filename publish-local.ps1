<#
.SYNOPSIS
    Builds and tests the Innovation Platform locally via Docker Compose.
.DESCRIPTION
    Builds the web app container image locally (no push to Docker Hub),
    generates Docker Compose artifacts, and starts everything.
    One command to test the full production deployment on your machine.
.PARAMETER ImageTag
    Tag for the local container image. Default: local
.PARAMETER Output
    Output directory. Default: dist-local
.PARAMETER Down
    Stop and remove all containers instead of starting them.
#>
param(
    [string]$ImageTag = "local",
    [string]$Output = "dist-local",
    [switch]$Down
)

$ErrorActionPreference = "Stop"
$AppHostProject = "src\Innovation.AppHost"
$ImageName = "innovation-web"
$FullImage = "${ImageName}:${ImageTag}"
$composeDir = "$Output\docker-compose"

# --- Down mode: just stop everything ---
if ($Down) {
    if (Test-Path "$composeDir\docker-compose.yaml") {
        Write-Host "Stopping containers..." -ForegroundColor Yellow
        docker compose -f "$composeDir\docker-compose.yaml" down
        Write-Host "Containers stopped." -ForegroundColor Green
    } else {
        Write-Host "No compose file found at $composeDir" -ForegroundColor Yellow
    }
    return
}

Write-Host "=== Innovation Platform — Local Test ===" -ForegroundColor Cyan
Write-Host "Image:  $FullImage"
Write-Host "Output: $Output"
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

# --- Build container image locally ---
Write-Host "Building container image: $FullImage ..." -ForegroundColor Yellow

dotnet publish src\Innovation.Web -c Release `
    -p:PublishProfile=DefaultContainer `
    -p:ContainerRepository=$ImageName `
    -p:ContainerImageTag=$ImageTag

Write-Host "Image built: $FullImage" -ForegroundColor Green

# --- Generate Docker Compose ---
Write-Host ""
Write-Host "Generating Docker Compose artifacts..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $composeDir -Force | Out-Null

$env:PUBLISH_TARGET = "docker"
aspire publish --project $AppHostProject `
    --publisher docker `
    --output-path $composeDir `
    --image-tag $ImageTag
Remove-Item Env:\PUBLISH_TARGET

# Post-process generated compose
$composeFile = "$composeDir\docker-compose.yaml"
$compose = Get-Content $composeFile -Raw

# Keycloak: change 'start' to 'start-dev' (production mode requires HTTPS certs)
$compose = $compose -replace '- "start"', '- "start-dev"'

# Postgres: add POSTGRES_DB so the database is created on first start
$compose = $compose -replace '(POSTGRES_USER: "postgres")', 'POSTGRES_DB: "innovationdb"
      $1'

# Web: add ConnectionStrings__keycloak and FrontendUrl for browser redirects
$compose = $compose -replace '(KEYCLOAK_HTTP: "http://keycloak:8080")', '$1
      ConnectionStrings__keycloak: "http://keycloak:8080"
      Keycloak__FrontendUrl: "http://localhost:8080"'

# Postgres: healthcheck so dependents can wait for readiness
$compose = $compose -replace '(image: "docker.io/ankane/pgvector:latest")', @'
$1
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d innovationdb"]
      interval: 5s
      timeout: 3s
      retries: 15
'@

# Keycloak: healthcheck via management port (KC_HEALTH_ENABLED=true exposes /health on :9000)
$compose = $compose -replace '(image: "quay.io/keycloak/keycloak:[\d.]+")', @'
$1
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/9000"]
      interval: 5s
      timeout: 3s
      retries: 30
      start_period: 15s
'@

# Web: wait for healthy postgres and keycloak before starting
$compose = $compose -replace '(postgres:\s+condition: )"service_started"', '$1"service_healthy"'
$compose = $compose -replace '(keycloak:\s+condition: )"service_started"', '$1"service_healthy"'

# Web: expose port to host for browser access
$compose = $compose -replace '(\s+ports:\s*\n\s+- "\$\{WEB_PORT\}")', @'

    ports:
      - "5200:${WEB_PORT}"
'@

Set-Content -Path $composeFile -Value $compose -NoNewline

# Copy deploy config
Copy-Item -Recurse -Force deploy\keycloak $composeDir\keycloak
Copy-Item -Recurse -Force deploy\ldap $composeDir\ldap

# Populate .env with working defaults (local image, no registry prefix)
$envContent = @"
# === Innovation Platform — Local Test ===

# Container image (local, not pushed to registry)
WEB_IMAGE=$FullImage
WEB_PORT=8080

# PostgreSQL
POSTGRES_PASSWORD=$(New-Password)

# Redis
REDIS_PASSWORD=$(New-Password)

# Keycloak (admin console)
KEYCLOAK_PASSWORD=$(New-Password)

# Bind mounts
OPENLDAP_BINDMOUNT_0=./ldap
KEYCLOAK_BINDMOUNT_0=./keycloak/realms
KEYCLOAK_BINDMOUNT_1=./keycloak/themes
"@
Set-Content -Path "$composeDir\.env" -Value $envContent -NoNewline

# --- Start containers ---
Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Yellow
docker compose -f "$composeDir\docker-compose.yaml" up -d

Write-Host ""
Write-Host "=== Local test environment ready ===" -ForegroundColor Green
Write-Host ""
Write-Host "  App:       http://localhost:5200" -ForegroundColor Cyan
Write-Host "  Keycloak:  http://localhost:8080" -ForegroundColor Cyan
Write-Host "  Dashboard: http://localhost:18888" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Logs:      docker compose -f $composeDir\docker-compose.yaml logs -f web" -ForegroundColor DarkGray
Write-Host "  Stop:      .\publish-local.ps1 -Down" -ForegroundColor DarkGray
