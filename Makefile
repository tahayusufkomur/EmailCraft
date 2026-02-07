.PHONY: help install install-backend install-frontend \
       dev dev-backend dev-frontend \
       build migrate makemigrations \
       test test-backend lint-frontend \
       seed create-key shell dbshell clean

VENV := venv/bin
PYTHON := $(VENV)/python3
PIP := $(VENV)/pip
BACKEND := backend
MANAGE := $(PYTHON) $(BACKEND)/manage.py
FRONTEND := frontend

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

# ─── Install ──────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Create venv and install Python deps
	@python3 -m venv venv
	@$(PIP) install -r $(BACKEND)/requirements.txt

install-frontend: ## Install Node deps
	@cd $(FRONTEND) && npm install

# ─── Development ──────────────────────────────────────────

dev: ## Run backend + frontend concurrently
	@make -j2 dev-backend dev-frontend

dev-backend: ## Run Django dev server on :8000
	@DJANGO_COLORS=nocolor $(MANAGE) runserver

dev-frontend: ## Run Vite dev server on :5173
	@cd $(FRONTEND) && NO_COLOR=1 npx vite --host

# ─── Build ────────────────────────────────────────────────

build: ## Production build of frontend
	@cd $(FRONTEND) && npm run build

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
	@cd $(FRONTEND) && npx tsc --noEmit

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

clean: ## Remove build artifacts and caches
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@rm -rf $(FRONTEND)/dist $(FRONTEND)/node_modules/.vite
	@rm -f $(BACKEND)/db.sqlite3
