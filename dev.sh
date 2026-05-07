#!/bin/bash

# Run Tabletop in local dev mode (native backend + frontend).
# Usage:
#   ./dev.sh                         Staging env + real Clerk auth (default)
#   ./dev.sh [env-file]              Custom env file + real Clerk auth


ENV_FILE=".env.staging"
WITH_AUTH=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-auth)
      WITH_AUTH=true
      shift
      ;;
    --mock-auth)
      WITH_AUTH=false
      shift
      ;;
    *)
      ENV_FILE="$1"
      shift
      ;;
  esac
done

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌  $ENV_FILE not found.${NC}"
  if [ "$ENV_FILE" = ".env.staging" ]; then
    echo -e "${YELLOW}    Create .env.staging with staging service values.${NC}"
  else
    echo -e "${YELLOW}    Create $ENV_FILE with the appropriate service values.${NC}"
  fi
  exit 1
fi

echo -e "${YELLOW}🚀  Starting Tabletop dev environment with $ENV_FILE...${NC}"

# Load env vars into current shell so child processes inherit them
while IFS= read -r line || [ -n "$line" ]; do
  [[ "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
  export "$line"
done < "$ENV_FILE"

# ---- Real auth validation ----
if $WITH_AUTH; then
  echo ""
  echo -e "${YELLOW}🔐  Starting with REAL Clerk authentication.${NC}"
  echo -e "${YELLOW}    Ensure your $ENV_FILE has real keys (not dev dummy values).${NC}"
  echo -e "${YELLOW}    Use .env.staging for staging service values.${NC}"
  echo ""

  # Force DEV_SKIP_AUTH off (export so Go backend sees it)
  export DEV_SKIP_AUTH=false

  # Validate required real keys
  MISSING=()

  if [ -z "$CLERK_SECRET_KEY" ] || [ "$CLERK_SECRET_KEY" = "sk_test_dev" ]; then
    MISSING+=("CLERK_SECRET_KEY (should be sk_test_... from Clerk Dashboard → API Keys)")
  fi
  if [ -z "$CLERK_JWKS_URL" ] || [ "$CLERK_JWKS_URL" = "https://clerk.local/.well-known/jwks.json" ]; then
    MISSING+=("CLERK_JWKS_URL (should be https://<your-domain>.clerk.accounts.dev/.well-known/jwks.json)")
  fi
  if [ -z "$CLERK_ISSUER" ]; then
    MISSING+=("CLERK_ISSUER (should be https://<your-domain>.clerk.accounts.dev)")
  fi
  if [ -z "$CLERK_AUDIENCE" ]; then
    MISSING+=("CLERK_AUDIENCE (should be e.g. 'tabletop')")
  fi
  if [ -z "$CLERK_PUBLISHABLE_KEY" ] || [ "$CLERK_PUBLISHABLE_KEY" = "pk_test_dev" ]; then
    MISSING+=("CLERK_PUBLISHABLE_KEY (should be pk_test_... from Clerk Dashboard → API Keys)")
  fi
  if [ -z "$OMDB_API_KEY" ] || [ "$OMDB_API_KEY" = "dev" ]; then
    MISSING+=("OMDB_API_KEY (should be from https://www.omdbapi.com/apikey.aspx)")
  fi

  if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌  Real keys are MISSING or still set to dev defaults:${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    for m in "${MISSING[@]}"; do
      echo -e "${RED}    ✗  $m${NC}"
    done
    echo ""
    echo -e "${YELLOW}    To fix: edit $ENV_FILE and replace the dummy values${NC}"
    echo -e "${YELLOW}    with your real keys.${NC}"
    echo ""
    echo -e "${YELLOW}    Or pass --mock-auth with an env file configured for local services.${NC}"
    echo ""
    exit 1
  fi

  echo -e "${GREEN}✅  All real keys verified${NC}"
  echo ""
fi

LOCAL_DB=false
LOCAL_REDIS=false

if [[ "${DATABASE_URL:-}" == *"@localhost:"* || "${DATABASE_URL:-}" == *"@127.0.0.1:"* ]]; then
  LOCAL_DB=true
fi

if [[ "${REDIS_URL:-}" == redis://localhost:* || "${REDIS_URL:-}" == redis://127.0.0.1:* ]]; then
  LOCAL_REDIS=true
fi

if $LOCAL_DB || $LOCAL_REDIS; then
  if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌  Docker is not running, but $ENV_FILE points at local Docker infrastructure.${NC}"
    exit 1
  fi

  SERVICES=()
  if $LOCAL_DB; then
    SERVICES+=("db")
  fi
  if $LOCAL_REDIS; then
    SERVICES+=("redis")
  fi

  echo -e "${YELLOW}🐳  Starting local Docker services (${SERVICES[*]})...${NC}"
  docker compose up -d "${SERVICES[@]}"
else
  echo -e "${GREEN}✅  Using remote staging infrastructure from $ENV_FILE${NC}"
fi

# Wait for Postgres
if $LOCAL_DB; then
  echo -e "${YELLOW}⏳  Waiting for local Postgres...${NC}"
  RETRIES=0
  MAX_RETRIES=30
  until docker exec tabletop-db pg_isready -U dev -d tabletop > /dev/null 2>&1; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -ge $MAX_RETRIES ]; then
      echo -e "${RED}❌  Postgres didn't start after ${MAX_RETRIES}s. Check: docker logs tabletop-db${NC}"
      exit 1
    fi
    sleep 1
  done
  echo -e "${GREEN}✅  Local Postgres is ready${NC}"
fi

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}📦  Installing frontend dependencies...${NC}"
  (cd frontend && npm install)
fi

# Trap to kill background processes on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑  Shutting down...${NC}"
  # Kill entire process groups first (catches npm -> node, etc.)
  kill -TERM -$BACKEND_PID 2>/dev/null || true
  kill -TERM -$FRONTEND_PID 2>/dev/null || true
  # Fallback direct kill
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}✅  Done${NC}"
  exit 0
}
# Enable job control so background jobs run in their own process groups.
# This lets us kill the entire tree (e.g. npm -> node) via negative PID.
set -m

trap cleanup INT TERM EXIT

# Export VITE_* vars so Vite picks them up without a frontend/.env.local file
export VITE_DEV_SKIP_AUTH="${DEV_SKIP_AUTH:-true}"
export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"
export VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"
export VITE_CLERK_JWT_TEMPLATE="${VITE_CLERK_JWT_TEMPLATE:-${CLERK_JWT_TEMPLATE:-${CLERK_AUDIENCE:-}}}"

# Detect air for hot-reload, fall back to go run
if command -v air >/dev/null 2>&1; then
  echo -e "${GREEN}🟢  Starting backend (Go + air hot-reload)...${NC}"
  (cd backend && air) &
  BACKEND_PID=$!
else
  echo -e "${YELLOW}⚠️  air not found. Falling back to 'go run' (no hot-reload).${NC}"
  echo -e "${YELLOW}    Install: go install github.com/air-verse/air@latest${NC}"
  (cd backend && go run ./cmd/api) &
  BACKEND_PID=$!
fi

# Start frontend
echo -e "${GREEN}🟢  Starting frontend (Vite)...${NC}"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅  Backend running at  http://localhost:8080${NC}"
echo -e "${GREEN}✅  Frontend running at http://localhost:3000${NC}"
echo -e "${YELLOW}🛑  Press Ctrl+C to stop both${NC}"
echo ""

# Wait for background processes; Ctrl+C triggers the trap defined above
wait $BACKEND_PID $FRONTEND_PID
