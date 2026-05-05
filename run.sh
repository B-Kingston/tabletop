#!/bin/bash

# ==============================================
# Tabletop — Frontend Production Build & Serve
# ==============================================
# Builds the React frontend via Docker (Vite → Nginx)
# and serves it locally on port 3000.
#
# Usage: ./run.sh [env-file]
# Default env-file: .env
#
# Required env vars (from the env file):
#   CLERK_PUBLISHABLE_KEY — Clerk frontend key
#   VITE_API_URL           — Backend API URL (default: http://localhost:8080)
# ==============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${1:-.env}"

# Colours
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌  Docker is not running. Start Docker first.${NC}"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌  $ENV_FILE not found.${NC}"
  echo -e "${YELLOW}    Run: cp .env.example $ENV_FILE${NC}"
  echo -e "${YELLOW}    Then fill in CLERK_PUBLISHABLE_KEY and VITE_API_URL.${NC}"
  exit 1
fi

echo -e "${YELLOW}📦  Loading env from $ENV_FILE ...${NC}"

# Load env vars
set -a
source "$ENV_FILE"
set +a

# Defaults
VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"

if [ -z "$CLERK_PUBLISHABLE_KEY" ] || [ "$CLERK_PUBLISHABLE_KEY" = "pk_test_..." ]; then
  echo -e "${RED}❌  CLERK_PUBLISHABLE_KEY is missing or still the placeholder.${NC}"
  echo -e "${YELLOW}    Set it in $ENV_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}🔨  Building frontend Docker image ...${NC}"
echo -e "    CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY:0:12}..."
echo -e "    VITE_API_URL=${VITE_API_URL}"

docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="$CLERK_PUBLISHABLE_KEY" \
  --build-arg VITE_API_URL="$VITE_API_URL" \
  -t tabletop-web \
  "$SCRIPT_DIR/frontend"

# Stop and remove any existing container
docker rm -f tabletop-web 2>/dev/null || true

echo -e "${GREEN}🚀  Starting frontend on http://localhost:3000${NC}"
echo -e "${YELLOW}🛑  Press Ctrl+C to stop${NC}"
echo ""

docker run \
  --name tabletop-web \
  -p 3000:80 \
  --rm \
  tabletop-web
