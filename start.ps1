<#
.SYNOPSIS
    Starts the Innovation Platform services.
.DESCRIPTION
    Launches Identity.API and Innovation.Web as background processes.
    Requires PostgreSQL to be running and accessible.
.PARAMETER IdentityPort
    Port for Identity.API. Default: 5101
.PARAMETER WebPort
    Port for Innovation.Web. Default: 5200
.PARAMETER DbConnection
    PostgreSQL connection string for the identity database.
    Default: Host=localhost;Port=5432;Database=identitydb;Username=postgres;Password=postgres
#>
param(
    [int]$IdentityPort = 5101,
    [int]$WebPort = 5200,
    [string]$DbConnection = "Host=localhost;Port=5432;Database=identitydb;Username=postgres"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Innovation Platform — Startup ===" -ForegroundColor Cyan
Write-Host ""

# Check if executables exist (running from dist/ or repo root)
$identityExe = if (Test-Path "identity-api\Identity.API.exe") { "identity-api\Identity.API.exe" }
               elseif (Test-Path "dist\identity-api\Identity.API.exe") { "dist\identity-api\Identity.API.exe" }
               elseif (Test-Path "artifacts\publish\Identity.API\release_win-x64\Identity.API.exe") { "artifacts\publish\Identity.API\release_win-x64\Identity.API.exe" }
               else { $null }

$webExe = if (Test-Path "web\Innovation.Web.exe") { "web\Innovation.Web.exe" }
          elseif (Test-Path "dist\web\Innovation.Web.exe") { "dist\web\Innovation.Web.exe" }
          elseif (Test-Path "artifacts\publish\Innovation.Web\release_win-x64\Innovation.Web.exe") { "artifacts\publish\Innovation.Web\release_win-x64\Innovation.Web.exe" }
          else { $null }

if (-not $identityExe -or -not $webExe) {
    Write-Host "Error: Executables not found. Run publish.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Identity API: http://localhost:$IdentityPort"
Write-Host "Web App:      http://localhost:$WebPort"
Write-Host "Database:     $DbConnection"
Write-Host ""

# Set environment variables
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:ASPNETCORE_URLS = "http://localhost:$IdentityPort"
$env:ConnectionStrings__identitydb = $DbConnection

Write-Host "Starting Identity.API..." -ForegroundColor Yellow
$identityDir = Split-Path -Parent (Resolve-Path $identityExe)
$identityProcess = Start-Process -FilePath (Resolve-Path $identityExe) -WorkingDirectory $identityDir -PassThru -NoNewWindow

# Wait for Identity.API to be ready
Write-Host "Waiting for Identity.API to start..." -ForegroundColor Gray
$timeout = (Get-Date).AddSeconds(30)
$ready = $false
while ((Get-Date) -lt $timeout -and -not $ready) {
    try {
        # Try /alive first (dev), fall back to /register which always exists via MapIdentityApi
        $response = Invoke-WebRequest -Uri "http://localhost:$IdentityPort/register" -Method OPTIONS -TimeoutSec 2 -ErrorAction SilentlyContinue
        $ready = $true
    } catch [System.Net.WebException] {
        # Connection refused = not started yet
        Start-Sleep -Milliseconds 500
    } catch {
        # Any other response (400, 405, etc.) means the server is up
        $ready = $true
    }
}

if ($ready) {
    Write-Host "Identity.API is ready." -ForegroundColor Green
} else {
    Write-Host "Warning: Identity.API may not be ready yet." -ForegroundColor Yellow
}

# Start Innovation.Web
$env:ASPNETCORE_URLS = "http://localhost:$WebPort"
$env:services__identity_api__http__0 = "http://localhost:$IdentityPort"

Write-Host "Starting Innovation.Web..." -ForegroundColor Yellow
$webDir = Split-Path -Parent (Resolve-Path $webExe)
$webProcess = Start-Process -FilePath (Resolve-Path $webExe) -WorkingDirectory $webDir -PassThru -NoNewWindow

Write-Host ""
Write-Host "=== All services started ===" -ForegroundColor Green
Write-Host "Open http://localhost:$WebPort in your browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray

# Wait and handle shutdown
try {
    while (-not $identityProcess.HasExited -and -not $webProcess.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Shutting down..." -ForegroundColor Yellow
    if (-not $identityProcess.HasExited) { Stop-Process -Id $identityProcess.Id -Force -ErrorAction SilentlyContinue }
    if (-not $webProcess.HasExited) { Stop-Process -Id $webProcess.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "All services stopped." -ForegroundColor Green
}
