.PHONY: dev prod test test-backend test-frontend build lint migrate migrate-check install

# Development — delegates to scripts for single source of truth
dev:
	@./dev.sh

prod:
	@./run.sh

# Testing
test:
	@make test-backend
	@make test-frontend

test-backend:
	@echo "Running backend tests..."
	@cd backend && go test ./... -v

test-backend-coverage:
	@echo "Running backend tests with coverage..."
	@cd backend && go test ./... -coverprofile=coverage.out && go tool cover -func=coverage.out

test-frontend:
	@echo "Running frontend tests..."
	@cd frontend && npx vitest run

test-frontend-coverage:
	@echo "Running frontend tests with coverage..."
	@cd frontend && npx vitest run --coverage

# Build
build:
	@cd backend && go build -o bin/api ./cmd/api
	@cd frontend && npm run build

# Lint
lint-backend:
	@cd backend && go vet ./...

lint-frontend:
	@cd frontend && npm run lint

# Database
migrate:
	@cd backend && go run ./cmd/api migrate

migrate-up:
	@echo "Running goose up..."
	@cd backend && go run -tags="$(shell cd backend && go list -m github.com/pressly/goose/v3 | awk '{print $$2}')" github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations postgres "$$DATABASE_URL" up

migrate-down:
	@echo "Running goose down (1 step)..."
	@cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations postgres "$$DATABASE_URL" down

migrate-create:
	@read -p "Migration name: " name; \
	cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations create "$$name" sql

migrate-status:
	@cd backend && go run github.com/pressly/goose/v3/cmd/goose@latest -dir=migrations postgres "$$DATABASE_URL" status

migrate-check:
	@echo "Checking migration safety guardrails..."
	@cd backend && GOCACHE="$$(pwd)/.cache/go-build" go test ./internal/database -run 'TestAllFutureMigrationsHaveSafetyApprovalForDestructiveStatements' -v

# Install
install:
	@cd frontend && npm install
