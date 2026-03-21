#!/usr/bin/env bash
# Generates TypeScript types (Reinforced.Typings) and route helpers (TsGen)
# Usage: bash scripts/generate.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Running Innovation.TsGen..."
dotnet run --project "$ROOT_DIR/src/Innovation.TsGen"
