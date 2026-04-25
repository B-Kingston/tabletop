#!/bin/bash

# Run Tabletop in production-like mode using Docker Compose
# Usage: ./run.sh [env-file]
# Default env-file: .env

set -e

ENV_FILE="${1:-.env}"

if ! docker info >/dev/null 2>&1; then
  echo "❌  Docker is not running. Start Docker first."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  $ENV_FILE not found."
  echo "    Run: cp .env.example $ENV_FILE"
  echo "    Then fill in your real API keys."
  exit 1
fi

if grep -q '^DEV_SKIP_AUTH=true' "$ENV_FILE" 2>/dev/null; then
  echo "⚠️  Warning: $ENV_FILE has DEV_SKIP_AUTH=true."
  echo "    This should not be enabled in prod-like mode."
fi

echo "🚀  Starting Tabletop with $ENV_FILE..."
docker compose --env-file "$ENV_FILE" up --build
