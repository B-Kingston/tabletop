#!/bin/bash

# Run Tabletop in local dev mode (native backend + frontend, Docker infra)
# Usage: ./dev.sh [env-file]
# Default env-file: .env.dev


ENV_FILE="${1:-.env.dev}"

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
