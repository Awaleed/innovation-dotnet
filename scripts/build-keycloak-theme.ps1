# Build Keycloak theme and copy JARs to AppHost
# Usage: .\scripts\build-keycloak-theme.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$themeDir = Join-Path $projectRoot "src\Innovation.KeycloakTheme"
$destDir = Join-Path $projectRoot "src\Innovation.AppHost\KeycloakThemes"

Write-Host "Building Keycloak theme..." -ForegroundColor Yellow

Push-Location $themeDir
try {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "vite build failed" }

    npx keycloakify build
    if ($LASTEXITCODE -ne 0) { throw "keycloakify build failed" }
}
finally {
    Pop-Location
}

# Copy JARs to AppHost
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir | Out-Null
}

Copy-Item "$themeDir\dist_keycloak\*.jar" $destDir -Force
Write-Host "Theme JARs copied to $destDir" -ForegroundColor Green
Get-ChildItem "$destDir\*.jar" | ForEach-Object { Write-Host "  $_" }
