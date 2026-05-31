# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MailCraft** — an embeddable email template builder SaaS. Developers integrate it via iframe + JS SDK, end users design email templates via drag-and-drop. Output is email-compatible HTML + JSON. Live at https://mailcraft.contentor.app.

## Deploy (home-server fleet — identical block across all four projects)

Deployment is driven from the central home-server repo, NOT from this repo. Never edit prod by hand or run docker compose on the server directly. (Migrated off the old Hetzner VPS, which is gone — the `deploy*`/`prod*` Make targets were removed.)

```bash
cd ~/ws/home-server && make deploy PROJECT=emailbuilder
```

Rsyncs the working tree to `taha@192.168.178.70:/opt/stacks/emailBuilder`, runs `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build` (the prod compose lives at the repo root; `docker/` holds the Dockerfiles + Caddyfile), and health-probes `mailcraft.contentor.app` via the Cloudflare-tunnel `edge` network (HTTP-only Caddy proxy; TLS at the edge). Fleet model + registry: `~/ws/home-server/AGENTS.md`.

## Commands

All commands are available via `make help`. Key ones:

```bash
make install            # Install all deps (venv + npm)
make dev                # Run backend (:8000) + frontend (:5173) concurrently
make dev-backend        # Django dev server only
make dev-frontend       # Vite dev server only
make build              # Production frontend build
make migrate            # Apply DB migrations
make makemigrations     # Generate new migrations
make test               # Run Django tests + TypeScript type-check
make seed               # Create demo org + test API key
make create-key ORG="Name" EMAIL="a@b.com" ENV=live
make shell              # Django shell
make clean              # Remove caches, build artifacts, db
```

## Architecture

### Backend (Django + DRF)
- **`core/`** — Organization, ApiKey models; API key auth middleware; session endpoint
- **`templates_api/`** — Template, UploadedImage models; CRUD ViewSet; gallery, upload, HTML export endpoints
- **`templates_api/export_engine.py`** — Server-side JSON→email HTML converter (table layout, inline CSS, VML)
- **`emailBuilder/`** — Django project config (settings, urls, wsgi/asgi)
- **API prefix**: `/api/v1/` — all endpoints require `X-API-Key` header except `/api/v1/auth/session`
- **Multi-tenancy**: Shared DB + `org_id` filtering via `TenantManager.for_org(org)` on all queries
- **Database**: PostgreSQL in both dev and prod (the dev compose runs Postgres too), via `DB_*` env vars (`DB_ENGINE`, `DB_NAME`, etc.)

### Frontend (React + TypeScript + Vite)
- **`frontend/src/store/`** — Zustand stores: `editorStore` (template state, block CRUD) and `configStore` (API config)
- **`frontend/src/components/Editor/`** — Canvas, BlockWrapper (sortable DnD), BlockRenderer
- **`frontend/src/components/Blocks/`** — 6 block types: Text (Tiptap), Image, Button, Divider, Columns, Social
- **`frontend/src/components/Panels/`** — BlockPalette (left), StylePanel (right), GlobalSettings, per-block settings
- **`frontend/src/components/Preview/`** — PreviewModal with desktop/mobile toggle
- **`frontend/src/components/Gallery/`** — TemplateGallery with pre-built templates
- **`frontend/src/lib/`** — `htmlExporter.ts` (client-side preview), `api.ts` (fetch wrapper), `blockFactory.ts`, `postMessage.ts`
- **`frontend/public/loader.js`** — SDK loader script for iframe embed (`MailCraft.init()`)

### Key Design Decisions
- Email HTML uses **table-based layout + inline CSS** (no div/flex) for client compatibility
- API key auth via middleware (not DRF auth classes) — key hashed with SHA-256, never stored in plaintext
- Template data stored as JSON in `json_data` field, versioned with `version` key
- Blocks: Text, Image, Button, Divider, Columns (nested), Social — each has data + style
- postMessage bridge: iframe↔host communication with `source: "mailcraft"` / `"mailcraft-host"` identifiers

## Rules

- Never create or write Markdown (.md) files unless explicitly asked by the user.
