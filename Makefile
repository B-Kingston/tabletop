.PHONY: dev dev-backend dev-frontend test test-backend test-frontend build docker-up docker-down lint

# Development
 dev:
	@echo "Starting all services..."
	@docker-compose up -d db redis
	@make dev-backend & make dev-frontend
	@wait

 dev-backend:
	@echo "Starting backend..."
	@cd backend && go run ./cmd/api

 dev-frontend:
	@echo "Starting frontend..."
	@cd frontend && npm run dev

# Testing
 test:
	@make test-backend
	@make test-frontend

 test-backend:
	@echo "Running backend tests..."
	@cd backend && go test ./... -v

 test-frontend:
	@echo "Running frontend tests..."
	@cd frontend && npx vitest run

# Build
 build:
	@cd backend && go build -o bin/api ./cmd/api
	@cd frontend && npm run build

# Docker
 docker-up:
	@docker-compose up -d

 docker-down:
	@docker-compose down

 docker-build:
	@docker-compose build

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
