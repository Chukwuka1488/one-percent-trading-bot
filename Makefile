# =============================================================================
# One Percent Trading Bot - Makefile
# =============================================================================
# Run `make help` to see all available targets
# =============================================================================

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DASHBOARD_DIR := dashboard
FREQTRADE_DIR := freqtrade
WORKTREE_DIR := ../worktrees

# -----------------------------------------------------------------------------
# SETUP TARGETS
# -----------------------------------------------------------------------------
.PHONY: setup
setup: setup-dashboard setup-worktrees ## Set up complete development environment
	@echo "✓ Setup complete"

.PHONY: setup-dashboard
setup-dashboard: ## Install dashboard dependencies
	cd $(DASHBOARD_DIR) && npm install

.PHONY: setup-worktrees
setup-worktrees: ## Create git worktrees for parallel development
	@mkdir -p $(WORKTREE_DIR)
	@git worktree add --detach $(WORKTREE_DIR)/dev-1 2>/dev/null || echo "dev-1 already exists"
	@git worktree add --detach $(WORKTREE_DIR)/dev-2 2>/dev/null || echo "dev-2 already exists"
	@git worktree add --detach $(WORKTREE_DIR)/dev-3 2>/dev/null || echo "dev-3 already exists"
	@git worktree add --detach $(WORKTREE_DIR)/dev-4 2>/dev/null || echo "dev-4 already exists"
	@echo "✓ Worktrees ready:"
	@git worktree list

.PHONY: setup-hooks
setup-hooks: ## Install git pre-commit hooks
	cd $(DASHBOARD_DIR) && npm install husky --save-dev
	cd $(DASHBOARD_DIR) && npx husky init
	@echo '#!/bin/sh\nmake check-quick' > $(DASHBOARD_DIR)/.husky/pre-commit
	@chmod +x $(DASHBOARD_DIR)/.husky/pre-commit
	@echo "✓ Pre-commit hook installed"

# -----------------------------------------------------------------------------
# CODE QUALITY TARGETS
# -----------------------------------------------------------------------------
.PHONY: check
check: check-lint check-types check-format test ## Run ALL code quality checks
	@echo "✓ All checks passed"

.PHONY: check-quick
check-quick: check-lint check-types ## Quick checks (no tests) - used by pre-commit
	@echo "✓ Quick checks passed"

.PHONY: check-lint
check-lint: ## Run linter
	cd $(DASHBOARD_DIR) && npm run lint

.PHONY: check-types
check-types: ## Run TypeScript type checking
	cd $(DASHBOARD_DIR) && npm run typecheck

.PHONY: check-format
check-format: ## Check formatting
	npm run format:check

.PHONY: format
format: ## Check formatting for markdown files
	npm run format:check

.PHONY: format-fix
format-fix: ## Fix formatting for markdown files
	npm run format:fix

# -----------------------------------------------------------------------------
# TEST TARGETS
# -----------------------------------------------------------------------------
.PHONY: test
test: test-dashboard ## Run all tests
	@echo "✓ All tests passed"

.PHONY: test-dashboard
test-dashboard: ## Run dashboard tests
	cd $(DASHBOARD_DIR) && npm test -- --passWithNoTests

.PHONY: test-freqtrade
test-freqtrade: ## Run Freqtrade strategy tests
	cd $(FREQTRADE_DIR) && docker compose run --rm freqtrade pytest

.PHONY: test-watch
test-watch: ## Run dashboard tests in watch mode
	cd $(DASHBOARD_DIR) && npm test -- --watch

# -----------------------------------------------------------------------------
# BUILD TARGETS
# -----------------------------------------------------------------------------
.PHONY: build
build: build-dashboard ## Build all components
	@echo "✓ Build complete"

.PHONY: build-dashboard
build-dashboard: ## Build dashboard for production
	cd $(DASHBOARD_DIR) && npm run build

# -----------------------------------------------------------------------------
# DEVELOPMENT TARGETS
# -----------------------------------------------------------------------------
.PHONY: dev
dev: ## Start dashboard development server
	cd $(DASHBOARD_DIR) && npm run dev

.PHONY: dev-all
dev-all: up dev ## Start Docker services AND dashboard dev server

# -----------------------------------------------------------------------------
# DOCKER TARGETS
# -----------------------------------------------------------------------------
.PHONY: up
up: ## Start all Docker services
	@mkdir -p .docker/postgres .docker/n8n .docker/prometheus .docker/grafana .docker/loki
	docker compose up -d

.PHONY: down
down: ## Stop all Docker services
	docker compose down

.PHONY: restart
restart: down up ## Restart all Docker services
	@echo "✓ Services restarted"

.PHONY: logs
logs: ## Tail logs from all services
	docker compose logs -f

.PHONY: logs-n8n
logs-n8n: ## Tail n8n logs
	docker compose logs -f n8n

.PHONY: logs-freqtrade
logs-freqtrade: ## Tail Freqtrade logs
	docker compose logs -f freqtrade

.PHONY: logs-grafana
logs-grafana: ## Tail Grafana logs
	docker compose logs -f grafana

.PHONY: ps
ps: ## Show running containers
	docker compose ps

# -----------------------------------------------------------------------------
# FREQTRADE TARGETS
# -----------------------------------------------------------------------------
.PHONY: trades
trades: ## Show open Freqtrade trades
	@curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/status | python3 -c "\
	import json, sys; \
	data = json.load(sys.stdin); \
	print('No open trades') if not data else (\
	print(f'Open Trades: {len(data)}'), \
	print('-' * 60), \
	[print(f\"{t['pair']:12} | Entry: \$${ t['open_rate']:,.2f} | P/L: {t['profit_pct']:.2f}%\") for t in data])"

.PHONY: balance
balance: ## Show Freqtrade wallet balance
	@curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/balance | python3 -m json.tool

.PHONY: profit
profit: ## Show Freqtrade profit summary
	@curl -s -u freqtrade:freqtrade http://localhost:8080/api/v1/profit | python3 -m json.tool

# -----------------------------------------------------------------------------
# SECURITY TARGETS
# -----------------------------------------------------------------------------
.PHONY: security
security: security-dashboard ## Run all security audits
	@echo "✓ Security audit complete"

.PHONY: security-dashboard
security-dashboard: ## Audit dashboard dependencies for vulnerabilities
	cd $(DASHBOARD_DIR) && npm audit

.PHONY: security-fix
security-fix: ## Auto-fix security vulnerabilities where possible
	cd $(DASHBOARD_DIR) && npm audit fix

# -----------------------------------------------------------------------------
# CLEAN TARGETS
# -----------------------------------------------------------------------------
.PHONY: clean
clean: ## Clean build artifacts
	rm -rf $(DASHBOARD_DIR)/dist
	rm -rf $(DASHBOARD_DIR)/node_modules/.cache
	@echo "✓ Cleaned build artifacts"

.PHONY: clean-all
clean-all: clean ## Clean everything including node_modules
	rm -rf $(DASHBOARD_DIR)/node_modules
	@echo "✓ Cleaned all dependencies (run 'make setup' to reinstall)"

.PHONY: clean-docker
clean-docker: down ## Stop services and remove volumes
	docker compose down -v
	@echo "✓ Docker volumes removed"

# -----------------------------------------------------------------------------
# WORKTREE TARGETS
# -----------------------------------------------------------------------------
.PHONY: worktrees
worktrees: ## List all git worktrees
	@git worktree list

.PHONY: worktree-prune
worktree-prune: ## Remove stale worktree references
	git worktree prune
	@echo "✓ Worktrees pruned"

# -----------------------------------------------------------------------------
# CI TARGETS (for GitHub Actions / CI pipelines)
# -----------------------------------------------------------------------------
.PHONY: ci
ci: setup-dashboard check build ## Run full CI pipeline
	@echo "✓ CI pipeline passed"

# -----------------------------------------------------------------------------
# HELP
# -----------------------------------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo "One Percent Trading Bot - Available Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Examples:"
	@echo "  make setup          # First-time setup"
	@echo "  make dev-all        # Start everything for development"
	@echo "  make check          # Run all quality checks"
	@echo "  make test           # Run all tests"

.DEFAULT_GOAL := help
