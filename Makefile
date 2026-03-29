.PHONY: help install install-backend install-frontends install-frontend install-frontend-site install-frontend-builder \
       dev dev-backend dev-frontend dev-frontend-site dev-frontend-builder \
       build build-frontend-site build-frontend-builder \
       migrate makemigrations \
       test test-backend lint-frontend lint-frontend-site lint-frontend-builder \
       seed seed-gallery sync-gallery demo-org create-key logs-backend shell dbshell superuser clean reset setup \
       install-frontend-local install-frontend-site-local install-frontend-builder-local \
       deploy deploy-shell deploy-superuser deploy-migrate deploy-seed deploy-seed-force deploy-sync-gallery deploy-logs

COMPOSE := docker compose
BACKEND := backend
FRONTEND_SITE := frontend
FRONTEND_BUILDER := frontend-email-builder
MANAGE := $(COMPOSE) exec backend python manage.py

help: ## Show this help
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@awk '/^# ─── /{gsub(/# ─── |─*/,""); printf "\033[1m%s\033[0m\n", $$0; next} \
		/^[a-zA-Z_-]+:.*?## /{split($$0,a,":.*?## "); printf "  %-28s %s\n", a[1], a[2]}' $(MAKEFILE_LIST)
	@echo ""

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

seed: ## Seed gallery templates + create demo org with provisioned templates
	@$(MANAGE) seed_gallery
	@$(MANAGE) create_demo_org

seed-gallery: ## Seed/update gallery templates
	@$(MANAGE) seed_gallery

sync-gallery: ## Sync gallery template updates to organization-provided copies
	@$(MANAGE) sync_gallery_to_orgs $(SYNC_GALLERY_FLAGS)

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

reset: ## Full reset: tear down everything, rebuild, migrate, seed, and install deps
	@$(COMPOSE) down -v --remove-orphans --rmi local
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@rm -rf $(FRONTEND_SITE)/dist $(FRONTEND_SITE)/node_modules/.vite $(FRONTEND_SITE)/node_modules
	@rm -rf $(FRONTEND_BUILDER)/dist $(FRONTEND_BUILDER)/node_modules/.vite $(FRONTEND_BUILDER)/node_modules
	@rm -rf venv
	@$(MAKE) setup

setup: ## Build/start stack, migrate DB, create superuser, seed demo org/template/key, and install frontend deps locally
	@$(COMPOSE) up -d --build
	@$(MANAGE) migrate
	@$(COMPOSE) exec -e DJANGO_SUPERUSER_USERNAME=t -e DJANGO_SUPERUSER_EMAIL=t@example.com -e DJANGO_SUPERUSER_PASSWORD=t \
		backend python manage.py createsuperuser --noinput || true
	@$(MANAGE) seed_gallery
	@$(MANAGE) create_demo_org
	@cd $(FRONTEND_SITE) && npm install
	@cd $(FRONTEND_BUILDER) && npm install

install-frontend-local: install-frontend-site-local install-frontend-builder-local ## Install both frontend deps on host (for VS Code/TS)

install-frontend-site-local: ## Install website deps on host
	@cd $(FRONTEND_SITE) && npm install

install-frontend-builder-local: ## Install builder deps on host
	@cd $(FRONTEND_BUILDER) && npm install

# ─── Production ──────────────────────────────────────────

PROD_HOST := root@46.224.76.186
PROD_DIR := /opt/mailcraft
PROD_COMPOSE := docker compose -f docker/docker-compose.prod.yml --env-file .env.prod
SYNC_GALLERY_FLAGS := $(if $(INCLUDE_MODIFIED),--include-modified,)

deploy-shell: ## Open Django shell on production
	@ssh $(PROD_HOST) -t "cd $(PROD_DIR) && $(PROD_COMPOSE) exec backend python manage.py shell"

deploy-superuser: ## Create superuser on production
	@ssh $(PROD_HOST) -t "cd $(PROD_DIR) && $(PROD_COMPOSE) exec backend python manage.py createsuperuser"

deploy-migrate: ## Run migrations on production
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && $(PROD_COMPOSE) exec -T backend python manage.py migrate"

deploy-seed: ## Pull latest code, rebuild backend, seed gallery templates, and sync org copies (set INCLUDE_MODIFIED=1 to overwrite modified provided templates)
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && git pull origin main && $(PROD_COMPOSE) up --build -d backend && $(PROD_COMPOSE) exec -T backend python manage.py seed_gallery && $(PROD_COMPOSE) exec -T backend python manage.py sync_gallery_to_orgs $(SYNC_GALLERY_FLAGS)"
	@echo "Gallery templates refreshed and synced on production."

deploy-seed-force: ## Same as deploy-seed, but always overwrites modified provided template copies
	@$(MAKE) deploy-seed INCLUDE_MODIFIED=1

deploy-sync-gallery: ## Pull latest code, rebuild backend, and sync gallery copies on production (set INCLUDE_MODIFIED=1 to overwrite modified provided templates)
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && git pull origin main && $(PROD_COMPOSE) up --build -d backend && $(PROD_COMPOSE) exec -T backend python manage.py sync_gallery_to_orgs $(SYNC_GALLERY_FLAGS)"
	@echo "Gallery template copies synced on production."

deploy: ## Deploy latest changes to production
	@echo "Pushing to origin..."
	@git push origin main
	@echo "Deploying to production..."
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && git pull origin main && $(PROD_COMPOSE) up --build -d && $(PROD_COMPOSE) exec -T backend python manage.py migrate"
	@echo "Deploy complete: https://mailcraft.contentor.app"

deploy-logs: ## Tail production logs
	@ssh $(PROD_HOST) "cd $(PROD_DIR) && $(PROD_COMPOSE) logs -f --tail=100"
