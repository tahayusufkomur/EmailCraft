.PHONY: help install install-backend install-frontends install-frontend install-frontend-site install-frontend-builder \
       dev dev-backend dev-frontend dev-frontend-site dev-frontend-builder \
       build build-frontend-site build-frontend-builder \
       migrate makemigrations \
       test test-backend lint-frontend lint-frontend-site lint-frontend-builder \
       seed demo-org create-key logs-backend shell dbshell superuser clean reset setup \
       install-frontend-local install-frontend-site-local install-frontend-builder-local

COMPOSE := docker compose
BACKEND := backend
FRONTEND_SITE := frontend
FRONTEND_BUILDER := frontend-email-builder
MANAGE := $(COMPOSE) exec backend python manage.py

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# ─── Install ──────────────────────────────────────────────

install: install-backend install-frontends ## Build all containers

install-backend: ## Build backend container
	@$(COMPOSE) build backend

install-frontends: install-frontend-site install-frontend-builder ## Install both frontend deps in containers

install-frontend: install-frontends ## Backward-compatible alias for both frontends

install-frontend-site: ## Install website frontend deps in container
	@$(COMPOSE) run --rm frontend npm install

install-frontend-builder: ## Install email-builder frontend deps in container
	@$(COMPOSE) run --rm frontend_email_builder npm install

# ─── Development ──────────────────────────────────────────

dev: ## Run backend + both frontends + proxy
	@$(COMPOSE) up

dev-backend: ## Run Django dev server on :8000
	@$(COMPOSE) up backend postgres

dev-frontend: ## Run both Vite dev servers
	@$(COMPOSE) up frontend frontend_email_builder

dev-frontend-site: ## Run website Vite dev server on :5173
	@$(COMPOSE) up frontend

dev-frontend-builder: ## Run builder Vite dev server on :5174
	@$(COMPOSE) up frontend_email_builder

# ─── Build ────────────────────────────────────────────────

build: build-frontend-site build-frontend-builder ## Production build of both frontends

build-frontend-site: ## Production build of website frontend
	@$(COMPOSE) run --rm frontend npm run build

build-frontend-builder: ## Production build of builder frontend
	@$(COMPOSE) run --rm frontend_email_builder npm run build

# ─── Database ─────────────────────────────────────────────

migrate: ## Apply database migrations
	@$(MANAGE) migrate

makemigrations: ## Create new migrations after model changes
	@$(MANAGE) makemigrations

# ─── Testing & Linting ───────────────────────────────────

test: test-backend lint-frontend ## Run all tests and linting

test-backend: ## Run Django tests
	@$(MANAGE) test

lint-frontend: lint-frontend-site lint-frontend-builder ## Type-check both frontends

lint-frontend-site: ## Type-check website frontend
	@$(COMPOSE) run --rm frontend npx tsc --noEmit

lint-frontend-builder: ## Type-check builder frontend
	@$(COMPOSE) run --rm frontend_email_builder npx tsc --noEmit

# ─── Utilities ────────────────────────────────────────────

seed: ## Create enterprise demo org + static API key + demo template + plan demo users (starter/pro/enterprise, password: demo)
	@$(MANAGE) create_demo_org

demo-org: ## Create demo org (usage: make demo-org ORG="Name" EMAIL="a@b.com" ENV=test API_KEY=mc_test_... USERNAME=demo USER_EMAIL=demo-user@mailcraft.dev PASSWORD=demo12345)
	@$(MANAGE) create_demo_org \
		--org-name "$(or $(ORG),MailCraft Demo Enterprise)" \
		--org-email "$(or $(EMAIL),demo-enterprise@mailcraft.dev)" \
		--env $(or $(ENV),test) \
		$(if $(API_KEY),--api-key "$(API_KEY)",) \
		$(if $(USERNAME),--demo-username "$(USERNAME)",) \
		$(if $(USER_EMAIL),--demo-user-email "$(USER_EMAIL)",) \
		$(if $(PASSWORD),--demo-password "$(PASSWORD)",)

create-key: ## Create API key (usage: make create-key ORG="Name" EMAIL="a@b.com" ENV=live PLAN=starter)
	@$(MANAGE) create_api_key --org-name "$(ORG)" --org-email "$(EMAIL)" --env $(or $(ENV),test) --plan $(or $(PLAN),free)

logs-backend: ## Tail backend container logs
	@$(COMPOSE) logs -f backend

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
	@rm -rf $(FRONTEND_SITE)/dist $(FRONTEND_SITE)/node_modules/.vite $(FRONTEND_SITE)/node_modules
	@rm -rf $(FRONTEND_BUILDER)/dist $(FRONTEND_BUILDER)/node_modules/.vite $(FRONTEND_BUILDER)/node_modules
	@rm -rf venv

setup: ## Build/start stack, migrate DB, create superuser, seed demo org/template/key, and install frontend deps locally
	@$(COMPOSE) up -d --build
	@$(MANAGE) migrate
	@$(COMPOSE) exec -e DJANGO_SUPERUSER_USERNAME=t -e DJANGO_SUPERUSER_EMAIL=t@example.com -e DJANGO_SUPERUSER_PASSWORD=t \
		backend python manage.py createsuperuser --noinput || true
	@$(MANAGE) create_demo_org
	@cd $(FRONTEND_SITE) && npm install
	@cd $(FRONTEND_BUILDER) && npm install

install-frontend-local: install-frontend-site-local install-frontend-builder-local ## Install both frontend deps on host (for VS Code/TS)

install-frontend-site-local: ## Install website deps on host
	@cd $(FRONTEND_SITE) && npm install

install-frontend-builder-local: ## Install builder deps on host
	@cd $(FRONTEND_BUILDER) && npm install
