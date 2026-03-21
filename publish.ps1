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
        /t:PublishContainer `
        -p:ContainerImageName=$ImageName `
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

    # Post-process generated compose: fix Keycloak (needs start-dev for HTTP) and Postgres (needs DB name)
    $composeFile = "$dockerOut\docker-compose.yaml"
    $compose = Get-Content $composeFile -Raw

    # Keycloak: change 'start' to 'start-dev' (production mode requires HTTPS certs)
    $compose = $compose -replace '- "start"', '- "start-dev"'

    # Postgres: add POSTGRES_DB so the database is created on first start
    $compose = $compose -replace '(POSTGRES_USER: "postgres")', 'POSTGRES_DB: "innovationdb"
      $1'

    Set-Content -Path $composeFile -Value $compose -NoNewline

    # Copy deploy config alongside generated compose files
    Copy-Item -Recurse -Force deploy\keycloak $dockerOut\keycloak
    Copy-Item -Recurse -Force deploy\ldap $dockerOut\ldap

    # Populate .env with working defaults
    $envContent = @"
# === Innovation Platform — Environment Configuration ===

# Container image for web app
WEB_IMAGE=$FullImage
WEB_PORT=8080

# PostgreSQL
POSTGRES_PASSWORD=$(New-Password)

# Redis
REDIS_PASSWORD=$(New-Password)

# Keycloak (admin console)
KEYCLOAK_PASSWORD=$(New-Password)

# Bind mounts (relative to this docker-compose file)
OPENLDAP_BINDMOUNT_0=./ldap
KEYCLOAK_BINDMOUNT_0=./keycloak/realms
KEYCLOAK_BINDMOUNT_1=./keycloak/themes
"@
    Set-Content -Path "$dockerOut\.env" -Value $envContent -NoNewline

    # Also create .env.example with placeholder passwords
    $envExample = $envContent `
        -replace '(POSTGRES_PASSWORD=).*', '${1}CHANGE_ME' `
        -replace '(REDIS_PASSWORD=).*', '${1}CHANGE_ME' `
        -replace '(KEYCLOAK_PASSWORD=).*', '${1}CHANGE_ME'
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
    Write-Host "  Docker Compose: cd $Output\docker-compose && docker compose up -d"
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
