#!/bin/bash

# Run Tabletop in local dev mode (native backend + frontend, Docker infra)
# Usage:
#   ./dev.sh                     Mock auth (default, no real keys needed)
#   ./dev.sh [env-file]          Use a different env file
#   ./dev.sh --with-auth          Real Clerk + TMDB + OpenAI auth
#   ./dev.sh [env-file] --with-auth   Custom env file + real auth


ENV_FILE=".env.dev"
WITH_AUTH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-auth)
      WITH_AUTH=true
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

if ! docker info >/dev/null 2>&1; then
  echo -e "${RED}❌  Docker is not running. Start Docker first.${NC}"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌  $ENV_FILE not found.${NC}"
  echo -e "${YELLOW}    Run: cp .env.dev.example $ENV_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}🚀  Starting Tabletop dev environment with $ENV_FILE...${NC}"

# Load env vars into current shell so child processes inherit them
set -a
source "$ENV_FILE"
set +a

# ---- Real auth validation ----
if $WITH_AUTH; then
  echo ""
  echo -e "${YELLOW}🔐  Starting with REAL Clerk authentication.${NC}"
  echo -e "${YELLOW}    Ensure your $ENV_FILE has real keys (not dev dummy values).${NC}"
  echo -e "${YELLOW}    See .env.dev.example → [REAL KEYS MODE] section for setup.${NC}"
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
  if [ -z "$TMDB_API_KEY" ] || [ "$TMDB_API_KEY" = "dev" ]; then
    MISSING+=("TMDB_API_KEY (should be from https://www.themoviedb.org/settings/api)")
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
    echo -e "${YELLOW}    with your real keys.  See .env.dev.example for details.${NC}"
    echo ""
    echo -e "${YELLOW}    Or run without --with-auth to use mock auth:${NC}"
    echo -e "${YELLOW}      ./dev.sh${NC}"
    echo ""
    exit 1
  fi

  echo -e "${GREEN}✅  All real keys verified${NC}"
  echo ""
fi

# Start infrastructure (Postgres + Redis)
echo -e "${YELLOW}🐳  Starting Docker services (db, redis)...${NC}"
docker compose up -d db redis

# Wait for Postgres
echo -e "${YELLOW}⏳  Waiting for Postgres...${NC}"
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
echo -e "${GREEN}✅  Postgres is ready${NC}"

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
