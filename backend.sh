#!/bin/bash

# ==============================================
# Tabletop — Backend Deploy to Fly.io
# ==============================================
# Builds the Go backend Docker image and deploys
# to Fly.io using fly deploy.
#
# Usage:
#   ./backend.sh              Deploy to Fly.io, loading secrets from .env
#   ./backend.sh --status     Show deployment status
#   ./backend.sh --logs       Tail live logs
#   ./backend.sh --secrets    List configured secrets
#   ./backend.sh --set-secret KEY=VALUE   Set a secret
#
# Env:
#   BACKEND_ENV_FILE=.env.staging ./backend.sh
# ==============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="tabletop-api-frosty-flower-1050"
ENV_FILE="${BACKEND_ENV_FILE:-$SCRIPT_DIR/.env}"

# Colours
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---- helpers ----
load_env() {
  if [ -f "$ENV_FILE" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
      [[ "$line" =~ ^[[:space:]]*$ || "$line" =~ ^[[:space:]]*# ]] && continue
      [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
      export "$line"
    done < "$ENV_FILE"
  fi
}

check_fly() {
  if ! command -v fly >/dev/null 2>&1; then
    echo -e "${RED}❌  fly CLI not found.${NC}"
    echo -e "${YELLOW}    Install: curl -L https://fly.io/install.sh | sh${NC}"
    exit 1
  fi
}

sync_fly_secrets_from_env() {
  local names=("$@")
  local synced=()
  local secret_args=()

  for name in "${names[@]}"; do
    local value="${!name:-}"
    if [ -n "$value" ]; then
      synced+=("$name")
      secret_args+=("$name=$value")
    fi
  done

  if [ ${#synced[@]} -gt 0 ]; then
    echo -e "${YELLOW}🔐  Syncing secrets from $(basename "$ENV_FILE") in one Fly release ...${NC}"
    fly secrets set -a "$APP_NAME" "${secret_args[@]}" >/dev/null
    echo -e "${GREEN}✅  Synced secrets: ${synced[*]}${NC}"
  fi
}

check_auth() {
  if ! fly auth whoami >/dev/null 2>&1; then
    echo -e "${RED}❌  Not authenticated with Fly.io.${NC}"
    echo -e "${YELLOW}    Run: fly auth login${NC}"
    exit 1
  fi
}

# ---- commands ----
cmd_status() {
  check_fly && check_auth
  fly status -a "$APP_NAME"
}

cmd_logs() {
  check_fly && check_auth
  echo -e "${BLUE}📋  Tailing logs for $APP_NAME ...${NC}"
  fly logs -a "$APP_NAME"
}

cmd_secrets() {
  check_fly && check_auth
  echo -e "${BLUE}🔐  Secrets for $APP_NAME:${NC}"
  fly secrets list -a "$APP_NAME"
}

cmd_set_secret() {
  check_fly && check_auth
  local kv="$1"
  if [ -z "$kv" ]; then
    echo -e "${RED}❌  Usage: ./backend.sh --set-secret KEY=VALUE${NC}"
    exit 1
  fi
  echo -e "${YELLOW}🔐  Setting secret: ${kv%%=*}=****${NC}"
  fly secrets set -a "$APP_NAME" "$kv"
}

cmd_migrate() {
  echo -e "${BLUE}🗄️  Running migrations ...${NC}"
  local db_url="${DATABASE_URL:-}"
  if [ -z "$db_url" ]; then
    echo -e "${YELLOW}   DATABASE_URL not set locally, fetching from Fly.io ...${NC}"
    db_url=$(fly secrets list -a "$APP_NAME" --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*"' | cut -d'"' -f4)
  fi
  if [ -z "$db_url" ]; then
    echo -e "${RED}❌  DATABASE_URL not found. Set it locally or on Fly.io.${NC}"
    exit 1
  fi
  cd "$SCRIPT_DIR/backend"
  go run github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations postgres "$db_url" up
}

cmd_migrate_status() {
  echo -e "${BLUE}🗄️  Migration status ...${NC}"
  local db_url="${DATABASE_URL:-}"
  if [ -z "$db_url" ]; then
    echo -e "${YELLOW}   DATABASE_URL not set locally, fetching from Fly.io ...${NC}"
    db_url=$(fly secrets list -a "$APP_NAME" --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*"' | cut -d'"' -f4)
  fi
  if [ -z "$db_url" ]; then
    echo -e "${RED}❌  DATABASE_URL not found. Set it locally or on Fly.io.${NC}"
    exit 1
  fi
  cd "$SCRIPT_DIR/backend"
  go run github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations postgres "$db_url" status
}

cmd_deploy() {
  check_fly && check_auth

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Tabletop Backend — Fly.io Deploy${NC}"
  echo -e "${BLUE}  App: $APP_NAME${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Push local .env values to Fly before verifying required secrets.
  if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}🔐  Loading deploy secrets from $ENV_FILE ...${NC}"
    sync_fly_secrets_from_env \
      DATABASE_URL \
      CLERK_SECRET_KEY \
      CLERK_PUBLISHABLE_KEY \
      CLERK_WEBHOOK_SECRET \
      CLERK_JWKS_URL \
      CLERK_ISSUER \
      CLERK_AUDIENCE \
      OMDB_API_KEY \
      OPENAI_API_KEY \
      REDIS_URL \
      FRONTEND_URL
    echo ""
  else
    echo -e "${YELLOW}⚠️   $ENV_FILE not found; checking existing Fly secrets only.${NC}"
    echo ""
  fi

  # Verify required secrets are set before deploying
  echo -e "${YELLOW}🔍  Checking required secrets ...${NC}"
  local secrets
  secrets=$(fly secrets list -a "$APP_NAME" 2>/dev/null || echo "")

  local missing=()
  for secret in DATABASE_URL CLERK_SECRET_KEY CLERK_PUBLISHABLE_KEY CLERK_JWKS_URL CLERK_ISSUER CLERK_AUDIENCE OMDB_API_KEY; do
    if ! echo "$secrets" | grep -q "$secret"; then
      missing+=("$secret")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    echo -e "${RED}❌  Missing secrets: ${missing[*]}${NC}"
    echo -e "${YELLOW}    Set them with: ./backend.sh --set-secret KEY=VALUE${NC}"
    echo -e "${YELLOW}    Required secrets:${NC}"
    echo -e "${YELLOW}      DATABASE_URL          — NeonDB connection string${NC}"
    echo -e "${YELLOW}      CLERK_SECRET_KEY      — Clerk backend secret${NC}"
    echo -e "${YELLOW}      CLERK_PUBLISHABLE_KEY — Clerk publishable key${NC}"
    echo -e "${YELLOW}      CLERK_JWKS_URL        — Clerk JWKS endpoint${NC}"
    echo -e "${YELLOW}      CLERK_ISSUER          — Clerk issuer URL${NC}"
    echo -e "${YELLOW}      CLERK_AUDIENCE        — Clerk JWT audience${NC}"
    echo -e "${YELLOW}      OMDB_API_KEY          — OMDb API key${NC}"
    echo -e "${YELLOW}      OPENAI_API_KEY        — (optional) OpenAI key${NC}"
    echo -e "${YELLOW}      REDIS_URL             — (optional) Redis URL${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅  All required secrets are set${NC}"
  echo ""

  # Deploy
  echo -e "${YELLOW}🚀  Deploying to Fly.io ...${NC}"
  echo ""

  cd "$SCRIPT_DIR/backend"
  fly deploy -a "$APP_NAME"

  echo ""
  echo -e "${GREEN}✅  Deployment complete!${NC}"
  echo -e "${GREEN}    Backend: https://${APP_NAME}.fly.dev${NC}"
  echo -e "${GREEN}    Monitor: fly status -a $APP_NAME${NC}"
}

# ---- main ----
load_env

case "${1:-}" in
  --status|-s)
    cmd_status
    ;;
  --logs|-l)
    cmd_logs
    ;;
  --secrets)
    cmd_secrets
    ;;
  --set-secret)
    cmd_set_secret "$2"
    ;;
  --migrate)
    cmd_migrate
    ;;
  --migrate-status)
    cmd_migrate_status
    ;;
  --help|-h)
    echo "Usage: ./backend.sh [command]"
    echo ""
    echo "Env:"
    echo "  BACKEND_ENV_FILE=path  Load deploy secrets from a file other than .env"
    echo ""
    echo "Commands:"
    echo "  (none)              Deploy backend to Fly.io"
    echo "  --status, -s        Show deployment status"
    echo "  --logs, -l          Tail live logs"
    echo "  --secrets           List configured secrets"
    echo "  --set-secret K=V    Set a Fly.io secret"
    echo "  --migrate           Run pending migrations against DATABASE_URL"
    echo "  --migrate-status    Show migration status"
    echo "  --help, -h          Show this help"
    ;;
  *)
    cmd_deploy
    ;;
esac
