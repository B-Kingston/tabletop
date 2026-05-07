#!/bin/bash

# ==============================================
# Tabletop — Frontend Production Build & Serve
# ==============================================
# Builds the React frontend via Docker (Vite → Nginx)
# and serves it locally on port 3000. The API is a deployed
# backend configured by VITE_API_URL.
#
# Usage: ./run.sh [env-file]
# Default env-file: .env
#
# Required env vars (from the env file):
#   CLERK_PUBLISHABLE_KEY — Clerk frontend key
#   CLERK_JWT_TEMPLATE    — Clerk JWT template with aud matching CLERK_AUDIENCE
#   VITE_API_URL           — Deployed backend API URL
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
  echo -e "${YELLOW}    Create $ENV_FILE with CLERK_PUBLISHABLE_KEY and VITE_API_URL.${NC}"
  exit 1
fi

echo -e "${YELLOW}📦  Loading env from $ENV_FILE ...${NC}"

# Load env vars
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
  export "$line"
done < "$ENV_FILE"

if [ -z "$CLERK_PUBLISHABLE_KEY" ] || [ "$CLERK_PUBLISHABLE_KEY" = "pk_test_..." ]; then
  echo -e "${RED}❌  CLERK_PUBLISHABLE_KEY is missing or still the placeholder.${NC}"
  echo -e "${YELLOW}    Set it in $ENV_FILE${NC}"
  exit 1
fi

CLERK_JWT_TEMPLATE="${CLERK_JWT_TEMPLATE:-${CLERK_AUDIENCE:-}}"

if [ -z "$CLERK_JWT_TEMPLATE" ] || [ "$CLERK_JWT_TEMPLATE" = "your-audience" ]; then
  echo -e "${RED}❌  CLERK_JWT_TEMPLATE is missing.${NC}"
  echo -e "${YELLOW}    Set it in $ENV_FILE to the Clerk JWT template whose aud matches CLERK_AUDIENCE.${NC}"
  exit 1
fi

if [ -z "$VITE_API_URL" ] || [[ "$VITE_API_URL" == "http://localhost"* ]] || [[ "$VITE_API_URL" == "http://127.0.0.1"* ]]; then
  echo -e "${RED}❌  VITE_API_URL must point at a deployed backend for run.sh.${NC}"
  echo -e "${YELLOW}    Set it in $ENV_FILE, e.g. https://your-staging-api.fly.dev${NC}"
  exit 1
fi

echo -e "${YELLOW}🔨  Building frontend Docker image ...${NC}"
echo -e "    CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY:0:12}..."
echo -e "    CLERK_JWT_TEMPLATE=${CLERK_JWT_TEMPLATE}"
echo -e "    VITE_API_URL=${VITE_API_URL}"

docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY="$CLERK_PUBLISHABLE_KEY" \
  --build-arg VITE_CLERK_JWT_TEMPLATE="$CLERK_JWT_TEMPLATE" \
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
