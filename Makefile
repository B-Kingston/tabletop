.PHONY: dev prod test test-backend test-frontend build lint migrate install

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

# Install
install:
	@cd frontend && npm install
