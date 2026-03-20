<#
.SYNOPSIS
    Builds and packages the Innovation Platform for deployment.
.DESCRIPTION
    Publishes Innovation.Web as a self-contained single-file
    executable and copies it into a dist/ folder ready for delivery.
.PARAMETER Runtime
    Target runtime identifier. Default: win-x64
    Examples: win-x64, win-arm64, linux-x64, osx-arm64
.PARAMETER Output
    Output directory for the packaged build. Default: dist
#>
param(
    [string]$Runtime = "win-x64",
    [string]$Output = "dist"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Innovation Platform — Publish ===" -ForegroundColor Cyan
Write-Host "Runtime: $Runtime"
Write-Host "Output:  $Output"
Write-Host ""

# Clean output
if (Test-Path $Output) {
    Remove-Item -Recurse -Force $Output
}
New-Item -ItemType Directory -Path $Output | Out-Null
New-Item -ItemType Directory -Path "$Output\web" | Out-Null

# Build React frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location src\Innovation.Web\ClientApp
npm install --silent
npm run build
Pop-Location

# Publish Innovation.Web
Write-Host "Publishing Innovation.Web..." -ForegroundColor Yellow
dotnet publish src\Innovation.Web -c Release -r $Runtime --self-contained -p:PublishSingleFile=true -o "$Output\web"

Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Green
Write-Host "Output: $Output\"
Write-Host ""
Write-Host "Contents:"
Write-Host "  $Output\web\Innovation.Web.exe"
Write-Host ""
Write-Host "To run: cd $Output\web && .\Innovation.Web.exe" -ForegroundColor Cyan
