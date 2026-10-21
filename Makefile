.PHONY: help dev up down restart dev-restart reset dev-reset logs dev-logs dev-shell \
       build migrate makemigrations test check seed seed-gallery sync-gallery create-key superuser \
       local-setup local-dev local-backend local-builder local-worker local-redis local-ai-reset

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

# ─── Local builder ───────────────────────────────────────
# Host processes: Django :8000 on backend/db.sqlite3, builder Vite :5174 (HMR), Celery worker;
# Redis :6391 in Docker. AI runs on the prod hub lane through the ssh tunnel on 127.0.0.1:39300
# (launchd com.pix4less.home-server-tunnel); images stay placeholders (no PIX4LESS_API_KEY). Open:
#   http://localhost:5174/builder/?apiKey=mc_test_00000000000000000000000000000000

LOCAL_ENV := DB_ENGINE=django.db.backends.sqlite3 DB_NAME=$(CURDIR)/backend/db.sqlite3 \
    AGENTC_LANE=mailcraft AGENTC_HUB=http://127.0.0.1:39300 CELERY_BROKER_URL=redis://127.0.0.1:6391/0
LOCAL_MANAGE := cd backend && $(LOCAL_ENV) ../.venv/bin/python manage.py

local-setup: ## One-time: .venv, npm deps, SQLite schema, gallery + demo org (re-run after pulls)
	@uv venv --allow-existing --python 3.12 .venv
	@uv pip install --python .venv/bin/python -r backend/requirements.txt
	@cd frontend-email-builder && npm install
	@$(LOCAL_MANAGE) migrate
	@$(LOCAL_MANAGE) seed_gallery --prune
	@$(LOCAL_MANAGE) create_demo_org

local-dev: ## Run Django (:8000), builder (:5174), Celery worker and Redis (:6391)
	@$(MAKE) -j4 local-redis local-backend local-worker local-builder

local-backend: ## Django only, :8000
	@$(LOCAL_MANAGE) runserver 8000

local-builder: ## Builder Vite only, :5174
	@cd frontend-email-builder && npm run dev

# Solo pool: no forking on macOS, and AI jobs run one at a time per org anyway; Celery time limits don't apply here.
local-worker: ## Celery worker for AI jobs (no autoreload: restart it after backend AI changes)
	@cd backend && $(LOCAL_ENV) ../.venv/bin/celery -A emailBuilder worker --pool=solo --loglevel=info

local-redis: ## Redis for Celery, :6391
	@docker rm -f mailcraft-local-redis >/dev/null 2>&1; docker run --rm --name mailcraft-local-redis -p 127.0.0.1:6391:6379 redis:7-alpine

local-ai-reset: ## Give the local demo accounts their AI generations back (the plan allows 5)
	@$(LOCAL_MANAGE) shell -c "from core.models import Account; print(Account.objects.update(ai_generations_count=0), 'accounts reset')"

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

