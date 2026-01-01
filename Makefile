# =============================================================================
# Makefile Template for AI-Assisted Development
# =============================================================================
# This Makefile contains common development commands from humor-WORKTREE-1
# All commands are commented out as templates - uncomment and adapt as needed
# =============================================================================

# -----------------------------------------------------------------------------
# CONFIGURATION VARIABLES
# -----------------------------------------------------------------------------
# Set your project-specific configuration here
# GCP_PROJECT ?= your-project-dev
# NAMESPACE ?= your-namespace

# -----------------------------------------------------------------------------
# FORMATTING TARGETS
# -----------------------------------------------------------------------------
# Check/fix formatting for markdown, YAML, and JSON files
# Requires: npm with prettier installed (npm install)

.PHONY: format
format: ## Check formatting for markdown files
	npm run format:check

.PHONY: format-fix
format-fix: ## Fix formatting for markdown files
	npm run format:fix

# -----------------------------------------------------------------------------
# CODE QUALITY CHECK TARGETS
# -----------------------------------------------------------------------------
# Run linting, type checking, and static analysis
# Adapt these for your specific language/framework

# .PHONY: check
# check: format check-lint check-types ## Run all code quality checks
# 	@echo "All checks passed!"

# .PHONY: check-lint
# check-lint: ## Run linter
# 	# For Go: golangci-lint run
# 	# For Python: ruff check . --fix
# 	# For TypeScript: npm run lint
# 	@echo "Implement linting for your project"

# .PHONY: check-types
# check-types: ## Run type checking
# 	# For TypeScript: npm run typecheck
# 	# For Python: mypy .
# 	@echo "Implement type checking for your project"

# -----------------------------------------------------------------------------
# TEST TARGETS
# -----------------------------------------------------------------------------
# Run tests for different components

# .PHONY: test
# test: ## Run all tests
# 	# For Go: go test -race -cover ./...
# 	# For Python: pytest
# 	# For TypeScript/JS: npm test
# 	@echo "Implement tests for your project"

# .PHONY: test-unit
# test-unit: ## Run unit tests only
# 	@echo "Implement unit tests for your project"

# .PHONY: test-integration
# test-integration: ## Run integration tests
# 	@echo "Implement integration tests for your project"

# .PHONY: test-e2e
# test-e2e: ## Run end-to-end tests
# 	@echo "Implement e2e tests for your project"

# -----------------------------------------------------------------------------
# BUILD TARGETS
# -----------------------------------------------------------------------------
# Compile/build your application

# .PHONY: build
# build: ## Build the application
# 	# For Go: go build -v -o bin/app ./cmd/app
# 	# For TypeScript/React: npm run build
# 	# For Python: poetry build
# 	@echo "Implement build for your project"

# .PHONY: build-all
# build-all: ## Build all components
# 	@echo "Implement build-all for your project"

# -----------------------------------------------------------------------------
# DOCKER BUILD TARGETS
# -----------------------------------------------------------------------------
# Build Docker images for containerized deployment

.PHONY: up
up: ## Start all Docker services
	docker compose up -d

.PHONY: down
down: ## Stop all Docker services
	docker compose down

.PHONY: logs
logs: ## Tail logs from all services
	docker compose logs -f

.PHONY: logs-n8n
logs-n8n: ## Tail n8n logs
	docker compose logs -f n8n

.PHONY: ps
ps: ## Show running containers
	docker compose ps

# .PHONY: docker-build
# docker-build: ## Build Docker image
# 	# docker build -t your-app:latest .
# 	@echo "Implement docker build for your project"

# .PHONY: docker-push
# docker-push: ## Build and push Docker image to registry
# 	# docker build -t gcr.io/$(GCP_PROJECT)/your-app:latest .
# 	# docker push gcr.io/$(GCP_PROJECT)/your-app:latest
# 	@echo "Implement docker push for your project"

# -----------------------------------------------------------------------------
# DEPLOYMENT TARGETS
# -----------------------------------------------------------------------------
# Deploy to various environments (k8s, cloud functions, etc.)

# .PHONY: deploy
# deploy: ## Deploy to development environment
# 	# kubectl apply -f k8s/dev/
# 	# OR: firebase deploy
# 	# OR: gcloud run deploy
# 	@echo "Implement deploy for your project"

# .PHONY: deploy-prod
# deploy-prod: ## Deploy to production (use with caution!)
# 	@echo "Implement production deploy for your project"

# -----------------------------------------------------------------------------
# SHELL/DEBUG TARGETS
# -----------------------------------------------------------------------------
# Access running pods/containers for debugging

# .PHONY: shell
# shell: ## Open shell in running container
# 	# kubectl exec -it deployment/your-app -n $(NAMESPACE) -- /bin/sh
# 	@echo "Implement shell access for your project"

# .PHONY: logs
# logs: ## Tail logs from running container
# 	# kubectl logs -f deployment/your-app -n $(NAMESPACE)
# 	@echo "Implement log tailing for your project"

# -----------------------------------------------------------------------------
# SETUP TARGETS
# -----------------------------------------------------------------------------
# Set up development environment

# .PHONY: setup
# setup: ## Set up development environment
# 	# npm install (or yarn install)
# 	# pip install -r requirements.txt
# 	# go mod download
# 	@echo "Implement setup for your project"

# .PHONY: setup-hooks
# setup-hooks: ## Install git hooks (husky, pre-commit, etc.)
# 	# npm install (installs husky via postinstall)
# 	# pre-commit install
# 	@echo "Implement git hooks setup for your project"

# -----------------------------------------------------------------------------
# CLEAN TARGETS
# -----------------------------------------------------------------------------
# Clean up build artifacts and temporary files

# .PHONY: clean
# clean: ## Clean build artifacts
# 	# rm -rf dist/ build/ *.egg-info/
# 	# rm -rf node_modules/ .next/
# 	# rm -f bin/*
# 	@echo "Implement clean for your project"

# -----------------------------------------------------------------------------
# DEVELOPMENT TARGETS
# -----------------------------------------------------------------------------
# Run the application in development mode

# .PHONY: dev
# dev: ## Start development server
# 	# For web apps: npm run dev
# 	# For Go: air (hot reload) or go run .
# 	# For Python: uvicorn app:app --reload
# 	@echo "Implement dev server for your project"

# .PHONY: dev-watch
# dev-watch: ## Start with file watching/hot reload
# 	@echo "Implement file watching for your project"

# -----------------------------------------------------------------------------
# DATABASE/MIGRATION TARGETS
# -----------------------------------------------------------------------------
# Database operations and migrations

# .PHONY: migrate
# migrate: ## Run database migrations
# 	# alembic upgrade head
# 	# npx prisma migrate dev
# 	# goose up
# 	@echo "Implement migrations for your project"

# .PHONY: migrate-rollback
# migrate-rollback: ## Rollback last migration
# 	@echo "Implement migration rollback for your project"

# -----------------------------------------------------------------------------
# SECURITY AUDIT TARGETS
# -----------------------------------------------------------------------------
# Security scanning for dependencies and code

# .PHONY: security-audit
# security-audit: ## Run security audit on dependencies
# 	# For Python: pip-audit -r requirements.txt --strict
# 	# For Node: npm audit
# 	# For Go: govulncheck ./...
# 	@echo "Implement security audit for your project"

# -----------------------------------------------------------------------------
# HELP TARGET
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo "Available targets:"
	@echo ""
	@echo "This Makefile is a template. Uncomment and adapt targets as needed."
	@echo ""
	@echo "Common patterns:"
	@echo "  make check        - Run all code quality checks"
	@echo "  make test         - Run all tests"
	@echo "  make build        - Build the application"
	@echo "  make dev          - Start development server"
	@echo "  make deploy       - Deploy to development environment"
	@echo ""
	@echo "See Makefile comments for detailed examples."

.DEFAULT_GOAL := help
