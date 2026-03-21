<#
.SYNOPSIS
    Builds and packages the Innovation Platform for deployment.
.DESCRIPTION
    Publishes the Innovation Platform using Aspire publishers to generate
    Docker Compose and/or Kubernetes deployment artifacts, push container
    images to Docker Hub, and optionally build a Windows self-contained EXE.
.PARAMETER Target
    Deployment target: docker, kubernetes, windows, all. Default: all
.PARAMETER Output
    Output directory for the packaged build. Default: dist
.PARAMETER ImageTag
    Tag for container images pushed to Docker Hub. Default: latest
.PARAMETER Runtime
    Runtime identifier for Windows EXE build. Default: win-x64
#>
param(
    [ValidateSet("docker", "kubernetes", "windows", "all")]
    [string]$Target = "all",
    [string]$Output = "dist",
    [string]$ImageTag = "latest",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"
$AppHostProject = "src\Innovation.AppHost"

Write-Host "=== Innovation Platform — Publish ===" -ForegroundColor Cyan
Write-Host "Target:   $Target"
Write-Host "Output:   $Output"
Write-Host "ImageTag: $ImageTag"
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

# --- Docker Compose ---
if ($Target -eq "docker" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "Publishing Docker Compose artifacts..." -ForegroundColor Yellow
    $dockerOut = "$Output\docker-compose"
    New-Item -ItemType Directory -Path $dockerOut -Force | Out-Null

    $env:PUBLISH_TARGET = "docker"
    aspire publish --project $AppHostProject `
        --publisher docker `
        --output-path $dockerOut `
        --image-tag $ImageTag
    Remove-Item Env:\PUBLISH_TARGET

    # Copy deploy config alongside generated compose files
    Copy-Item -Recurse -Force deploy\keycloak $dockerOut\keycloak
    Copy-Item -Recurse -Force deploy\ldap $dockerOut\ldap

    Write-Host "Docker Compose artifacts: $dockerOut" -ForegroundColor Green
}

# --- Kubernetes ---
if ($Target -eq "kubernetes" -or $Target -eq "all") {
    Write-Host ""
    Write-Host "Publishing Kubernetes manifests..." -ForegroundColor Yellow
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
    Write-Host "Building frontend..." -ForegroundColor Yellow
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
