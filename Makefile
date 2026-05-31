.PHONY: help dev up down restart dev-restart reset dev-reset logs dev-logs dev-shell \
       build migrate makemigrations test check seed seed-gallery sync-gallery create-key superuser

# Deployment lives in the home-server ops repo, not here:
#   cd ~/ws/home-server && make deploy PROJECT=emailbuilder
# (Migrated off Hetzner; the VPS deploy/prod Make targets were removed.)

COMPOSE := docker compose
MANAGE := $(COMPOSE) exec backend python manage.py
SYNC_GALLERY_FLAGS := $(if $(INCLUDE_MODIFIED),--include-modified,)

help: ## Show this help
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@awk '/^# ─── /{gsub(/# ─── |─*/,""); printf "\033[1m%s\033[0m\n", $$0; next} \
		/^[a-zA-Z_-]+:.*?## /{split($$0,a,":.*?## "); printf "  %-28s %s\n", a[1], a[2]}' $(MAKEFILE_LIST)
	@echo ""

# ─── Development ──────────────────────────────────────────

dev: ## Start all services (foreground)
	@$(COMPOSE) up

up: ## Start all services (detached)
	@$(COMPOSE) up -d

down: ## Stop all services
	@$(COMPOSE) down

restart: dev-restart ## alias for dev-restart
logs: dev-logs       ## alias for dev-logs
reset: dev-reset     ## alias for dev-reset

dev-restart: ## Restart all services without rebuilding or resetting data
	@$(COMPOSE) restart

dev-reset: ## Full reset: tear down, rebuild, migrate, seed
	@$(COMPOSE) down -v --remove-orphans --rmi local
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@rm -rf frontend/dist frontend/node_modules/.vite
	@rm -rf frontend-email-builder/dist frontend-email-builder/node_modules/.vite
	@$(COMPOSE) up -d --build
	@$(MANAGE) migrate
	@$(COMPOSE) exec -e DJANGO_SUPERUSER_USERNAME=t -e DJANGO_SUPERUSER_EMAIL=t@example.com -e DJANGO_SUPERUSER_PASSWORD=t \
		backend python manage.py createsuperuser --noinput || true
	@$(MANAGE) seed_gallery
	@$(MANAGE) create_demo_org
	@echo "Dev reset complete."

dev-logs: ## Tail all dev logs
	@$(COMPOSE) logs -f --tail=100

dev-shell: ## Open Django shell
	@$(MANAGE) shell

# ─── Build & Database ────────────────────────────────────

build: ## Production build of both frontends
	@$(COMPOSE) run --rm frontend npm run build
	@$(COMPOSE) run --rm frontend_email_builder npm run build

migrate: ## Apply database migrations
	@$(MANAGE) migrate

makemigrations: ## Create new migrations after model changes
	@$(MANAGE) makemigrations

# ─── Testing ─────────────────────────────────────────────

test: ## Run backend tests + frontend type-check
	@$(MANAGE) test
	@$(COMPOSE) run --rm frontend npx tsc --noEmit
	@$(COMPOSE) run --rm frontend_email_builder npx tsc --noEmit

check: test ## alias for `test` (backend tests + frontend type-check)

# ─── Utilities ────────────────────────────────────────────

seed: ## Seed gallery templates + create demo org
	@$(MANAGE) seed_gallery
	@$(MANAGE) create_demo_org

seed-gallery: ## Seed/update gallery templates only
	@$(MANAGE) seed_gallery

sync-gallery: ## Sync gallery updates to org copies
	@$(MANAGE) sync_gallery_to_orgs $(SYNC_GALLERY_FLAGS)

create-key: ## Create API key (usage: make create-key ORG="Name" EMAIL="a@b.com" ENV=live PLAN=starter)
	@$(MANAGE) create_api_key --org-name "$(ORG)" --org-email "$(EMAIL)" --env $(or $(ENV),test) --plan $(or $(PLAN),free)

superuser: ## Create Django superuser
	@$(MANAGE) createsuperuser

