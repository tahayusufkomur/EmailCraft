.PHONY: help install install-backend install-frontend \
       dev dev-backend dev-frontend \
       build migrate makemigrations \
       test test-backend lint-frontend \
       seed create-key shell dbshell clean

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

install-frontend: ## Build frontend container
	@$(COMPOSE) build frontend

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
	@$(MANAGE) create_api_key --org-name "Demo" --org-email "demo@mailcraft.io" --env test
  
create-key: ## Create API key (usage: make create-key ORG="Name" EMAIL="a@b.com" ENV=live)
	@$(MANAGE) create_api_key --org-name "$(ORG)" --org-email "$(EMAIL)" --env $(or $(ENV),test)

shell: ## Open Django shell
	@$(MANAGE) shell

dbshell: ## Open database shell
	@$(MANAGE) dbshell

superuser: ## Create Django superuser
	@$(MANAGE) createsuperuser

clean: ## Stop containers and remove volumes
	@$(COMPOSE) down -v --remove-orphans
