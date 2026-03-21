# Generates TypeScript types (Reinforced.Typings) and route helpers (TsGen)
# Usage: pwsh scripts/generate-ts.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Running Innovation.TsGen..." -ForegroundColor Cyan
dotnet run --project "$Root/src/Innovation.TsGen"
