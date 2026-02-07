.PHONY: help install install-backend install-frontend \
       dev dev-backend dev-frontend \
       build migrate makemigrations \
       test test-backend lint-frontend \
       seed create-key shell dbshell clean reset setup install-frontend-local

COMPOSE := docker compose
BACKEND := backend
FRONTEND := frontend
MANAGE := $(COMPOSE) exec backend python manage.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# ─── Install ──────────────────────────────────────────────

install: install-backend install-frontend ## Build all containers

install-backend: ## Build backend container
	@$(COMPOSE) build backend

install-frontend: ## Install frontend deps in container
	@$(COMPOSE) run --rm frontend npm install

# ─── Development ──────────────────────────────────────────

dev: ## Run backend + frontend + proxy
	@$(COMPOSE) up

dev-backend: ## Run Django dev server on :8000
	@$(COMPOSE) up backend postgres

dev-frontend: ## Run Vite dev server on :5173
	@$(COMPOSE) up frontend

# ─── Build ────────────────────────────────────────────────

build: ## Production build of frontend
	@$(COMPOSE) run --rm frontend npm run build

# ─── Database ─────────────────────────────────────────────

migrate: ## Apply database migrations
	@$(MANAGE) migrate

makemigrations: ## Create new migrations after model changes
	@$(MANAGE) makemigrations

# ─── Testing & Linting ───────────────────────────────────

test: test-backend lint-frontend ## Run all tests and linting

test-backend: ## Run Django tests
	@$(MANAGE) test

lint-frontend: ## Type-check frontend
	@$(COMPOSE) run --rm frontend npx tsc --noEmit

# ─── Utilities ────────────────────────────────────────────

seed: ## Create a demo org + test API key
	@$(MANAGE) create_api_key --org-name "Demo" --org-email "demo@mailcraft.io" --env test --plan free

create-key: ## Create API key (usage: make create-key ORG="Name" EMAIL="a@b.com" ENV=live PLAN=starter)
	@$(MANAGE) create_api_key --org-name "$(ORG)" --org-email "$(EMAIL)" --env $(or $(ENV),test) --plan $(or $(PLAN),free)

shell: ## Open Django shell
	@$(MANAGE) shell

dbshell: ## Open database shell
	@$(MANAGE) dbshell

superuser: ## Create Django superuser
	@$(MANAGE) createsuperuser

clean: ## Stop containers and remove volumes
	@$(COMPOSE) down -v --remove-orphans

reset: ## Reset containers, images, volumes, and local caches
	@$(COMPOSE) down -v --remove-orphans --rmi local
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules/.vite $(FRONTEND)/node_modules
	@rm -rf venv

setup: ## Build, start containers, and run migrations
	@$(COMPOSE) up -d --build
	@$(MANAGE) migrate
	@$(COMPOSE) exec -e DJANGO_SUPERUSER_USERNAME=t -e DJANGO_SUPERUSER_EMAIL=t@example.com -e DJANGO_SUPERUSER_PASSWORD=t \
		backend python manage.py createsuperuser --noinput || true
	@cd $(FRONTEND) && npm install

install-frontend-local: ## Install frontend deps on host (for VS Code/TS)
	@cd $(FRONTEND) && npm install
