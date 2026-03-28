# MailCraft Infrastructure & Deployment Design

## Overview

Deploy MailCraft to a single Hetzner CX23 VPS in fsn1, using Docker Compose with Caddy auto-TLS, Cloudflare DNS, serving `mailcraft.contentor.app`. Terraform provisions infrastructure. Manual deploy via SSH + git pull.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Topology | Single server | Early-stage SaaS, matches s3administrator pattern |
| Server | CX23, Ubuntu 24.04, fsn1 | Co-located with existing Hetzner Object Storage |
| Reverse proxy | Caddy | Auto HTTPS via Let's Encrypt, zero cert maintenance |
| Deployment | Git pull + rebuild on server | Simple, manual, no CI/CD overhead yet |
| Domain | mailcraft.contentor.app | Subdomain of existing contentor.app in Cloudflare |
| Routing | Path-based | `/api/*` → backend, `/builder/*` → builder, `/*` → site frontend |
| Static files | WhiteNoise | Serves static files from Django in production without a separate file server |

## Infrastructure (Terraform)

### Providers

- `hetznercloud/hcloud` — server, firewall, SSH key
- `cloudflare/cloudflare` — DNS record
- `hashicorp/random` — Postgres password generation

### Resources

**hcloud_server.prod**
- Name: `mailcraft-prod`
- Image: `ubuntu-24.04`
- Server type: `cx23`
- Location: `fsn1`
- SSH keys: existing Hetzner account key
- User data (cloud-init): installs Docker, Docker Compose, git, creates `/opt/mailcraft` directory

**hcloud_firewall.web**
- Name: `mailcraft-prod-fw`
- Inbound: TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS)
- Outbound: all TCP, UDP, ICMP

**hcloud_firewall_attachment.prod**
- Attaches firewall to server

**cloudflare_record.app**
- Zone: `contentor.app` (looked up via data source)
- Name: `mailcraft`
- Type: A
- Content: server IPv4
- Proxied: false (Caddy handles TLS directly)

**random_password.postgres**
- Length: 24, no special characters

### Variables

```hcl
variable "hcloud_token" {}
variable "cloudflare_api_token" {}
variable "cloudflare_zone_name" { default = "contentor.app" }
variable "domain_prefix" { default = "mailcraft" }
variable "server_type" { default = "cx23" }
variable "location" { default = "fsn1" }
```

### Outputs

- `server_ipv4` — server public IP
- `ssh_command` — `ssh root@<ip>`
- `app_url` — `https://mailcraft.contentor.app`
- `dns_record` — `mailcraft.contentor.app`

## Docker Compose Stack (Production)

### Architecture

```
Internet → Caddy (:80/:443, auto-TLS)
             ├── /api/*        → rewrite /api/v1/* → backend:8000
             ├── /admin/*      → backend:8000 (path preserved)
             ├── /static/*     → backend:8000 (WhiteNoise)
             ├── /builder/*    → builder:80
             └── /*            → frontend:80

backend (gunicorn + WhiteNoise, Django) ←→ postgres:5432
```

### Services

**caddy (proxy)**
- Image: `caddy:2-alpine`
- Ports: 80, 443
- Volumes: Caddyfile, caddy_data, caddy_config
- Depends on: backend, frontend, builder
- Restart: unless-stopped

**backend**
- Build: multi-stage Dockerfile
  - Stage 1: Python 3.12-slim, install deps (including gunicorn + whitenoise)
  - Stage 2: copy code, collectstatic (with dummy SECRET_KEY build arg), gunicorn entrypoint
- Command: `gunicorn emailBuilder.wsgi:application --bind 0.0.0.0:8000 --workers 3`
- Expose: 8000 (internal only)
- Depends on: postgres (condition: service_healthy)
- Environment: from `.env.prod`
- Restart: unless-stopped

**frontend (site)**
- Build: multi-stage Dockerfile
  - Stage 1: Node 20-alpine, `npm ci && npm run build`
  - Stage 2: nginx:alpine serving `dist/` with SPA try_files fallback
- Expose: 80 (internal only)
- Restart: unless-stopped

**builder (email builder)**
- Note: renamed from `frontend_email_builder` (dev compose) to `builder` (prod compose) for brevity
- Build: multi-stage Dockerfile
  - Stage 1: Node 20-alpine, `npm ci && npm run build` (with `--base=/builder/` for Vite)
  - Stage 2: nginx:alpine serving `dist/` with SPA try_files under `/builder/` base path
- Expose: 80 (internal only)
- Restart: unless-stopped

**postgres**
- Image: `postgres:16-alpine`
- Volumes: pgdata
- Environment: user/password/db from `.env.prod`
- Healthcheck: `pg_isready -U mailcraft -d mailcraft`
- No external port exposure
- Restart: unless-stopped

### Caddyfile

The existing nginx dev config maps `/api/` → `/api/v1/` (proxy_pass rewrite). Caddy must replicate this. `/admin/` and `/static/` must preserve their paths.

```
mailcraft.contentor.app {
    request_body {
        max_size 50MB
    }

    handle_path /api/* {
        rewrite * /api/v1{uri}
        reverse_proxy backend:8000
    }

    handle /admin/* {
        reverse_proxy backend:8000
    }

    handle /static/* {
        reverse_proxy backend:8000
    }

    handle_path /builder/* {
        reverse_proxy builder:80
    }

    handle {
        reverse_proxy frontend:80
    }
}
```

Key routing details:
- `handle_path /api/*` strips `/api/`, then `rewrite * /api/v1{uri}` reconstructs the path. So `/api/templates/` → `/api/v1/templates/` to Django.
- `handle /admin/*` preserves the full path — Django receives `/admin/...` as-is.
- `handle /static/*` preserves path — WhiteNoise serves from Django.
- `handle_path /builder/*` strips `/builder/` — the builder nginx serves from root.
- `request_body max_size 50MB` matches the dev nginx `client_max_body_size 50m` for image uploads.

### Frontend SPA nginx configs

**frontend.nginx.conf** (site):
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**builder.nginx.conf** (email builder):
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Both serve static files with SPA fallback. The builder is served at root inside its container because Caddy's `handle_path` strips `/builder/` before proxying.

## Production Dockerfiles

### backend.prod.Dockerfile

```dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn whitenoise

COPY . .

ARG DJANGO_SECRET_KEY=build-only-dummy-key
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ENV DJANGO_DEBUG=False
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "emailBuilder.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

Note: The `DJANGO_SECRET_KEY` build arg is a dummy value used only for `collectstatic` at build time. The real secret key is injected via `.env.prod` at runtime, overriding this value.

### frontend.prod.Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### builder.prod.Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --base=/builder/

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY builder.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

The `--base=/builder/` flag tells Vite to prefix all asset URLs with `/builder/` so they resolve correctly when served under the `/builder/` path.

## Production Environment Variables

File: `/opt/mailcraft/.env.prod` (on server, not in git)

```env
# App
APP_ENV=prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<generate with: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DJANGO_ALLOWED_HOSTS=mailcraft.contentor.app

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mailcraft
DB_USER=mailcraft
DB_PASSWORD=<from-terraform-random>
DB_HOST=postgres
DB_PORT=5432

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://mailcraft.contentor.app
CSRF_TRUSTED_ORIGINS=https://mailcraft.contentor.app

# S3 (existing Hetzner Object Storage)
AWS_ACCESS_KEY_ID=<existing>
AWS_SECRET_ACCESS_KEY=<existing>
AWS_BUCKET_NAME_DEV=contentor-email-builder-dev
AWS_BUCKET_NAME_PROD=contentor-email-builder-prod
AWS_ENDPOINT=https://fsn1.your-objectstorage.com
AWS_S3_KEY_PREFIX=emailBuilder
AWS_REGION=fsn1

# Stripe (production keys)
STRIPE_API_KEY=<prod-stripe-secret>
STRIPE_PUBLIC_KEY=<prod-stripe-public>
STRIPE_WEBHOOK_SECRET=<prod-webhook-secret>
STRIPE_SUCCESS_URL=https://mailcraft.contentor.app/pricing?status=success
STRIPE_CANCEL_URL=https://mailcraft.contentor.app/pricing?status=cancelled

# Google OAuth
GOOGLE_CLIENT_ID=<prod>
GOOGLE_CLIENT_SECRET=<prod>

# Email (optional — defaults to console backend if unset)
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=
# EMAIL_HOST_PASSWORD=
# DEFAULT_FROM_EMAIL=noreply@contentor.app

# Domain
DOMAIN=mailcraft.contentor.app
```

## Django Production Settings Changes

Settings already reads from env vars, so most changes are just `.env.prod` values. Code changes needed:

1. **STATIC_ROOT + WhiteNoise**: Add to settings.py:
   ```python
   STATIC_ROOT = BASE_DIR / 'staticfiles'
   ```
   Add WhiteNoise to MIDDLEWARE (after SecurityMiddleware):
   ```python
   'whitenoise.middleware.WhiteNoiseMiddleware',
   ```
   Add `whitenoise` to `requirements.txt`.

2. **CORS**: Fix empty-string bug. Replace the existing CORS config with:
   ```python
   CORS_ALLOW_ALL_ORIGINS = DEBUG
   CORS_ALLOW_CREDENTIALS = True
   if not DEBUG:
       _cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
       CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
   ```

3. **CSRF_TRUSTED_ORIGINS**: Required for Django 4+:
   ```python
   _csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
   CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]
   ```

4. **SECURE settings**:
   ```python
   if not DEBUG:
       SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
       SESSION_COOKIE_SECURE = True
       CSRF_COOKIE_SECURE = True
   ```

5. **SECRET_KEY validation**: Refuse to start with insecure default in production:
   ```python
   if not DEBUG and SECRET_KEY.startswith('django-insecure'):
       raise ValueError('Set DJANGO_SECRET_KEY for production')
   ```

## Deploy Workflow

### First-time setup

```bash
# After terraform apply
ssh root@<server-ip>
cd /opt/mailcraft
git clone <repo-url> .
cp docker/.env.prod.example .env.prod  # then fill in secrets

# Generate Django secret key:
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Build and start
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up --build -d
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod exec backend python manage.py migrate
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod exec backend python manage.py createsuperuser
```

### Subsequent deploys

```bash
ssh root@<server-ip>
cd /opt/mailcraft
git pull origin main
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up --build -d
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod exec backend python manage.py migrate  # if needed
```

## File Structure (new files)

```
infrastructure/
  main.tf
  variables.tf
  outputs.tf
  .env.example          # template for terraform API tokens
  .gitignore            # ignore .env, .terraform/, *.tfstate*
docker/
  docker-compose.prod.yml
  Caddyfile
  backend.prod.Dockerfile
  frontend.prod.Dockerfile
  frontend.nginx.conf
  builder.prod.Dockerfile
  builder.nginx.conf
  .env.prod.example     # template for production env vars
```

## Security Considerations

- Postgres not exposed externally (no port mapping to host)
- SSH key auth only (password auth disabled by default on Hetzner Ubuntu images)
- Firewall restricts inbound to 22, 80, 443
- `.env.prod` and terraform state contain secrets — never committed to git
- Django `DEBUG=False`, secure cookies, CSRF trusted origins set
- Django refuses to start with insecure default secret key in production
- Caddy auto-TLS with Let's Encrypt
- Cloudflare DNS not proxied (Caddy handles TLS) — can enable Cloudflare proxy later if needed
- Request body size limited to 50MB at Caddy level

## Out of Scope (for later)

- CI/CD pipeline (GitHub Actions)
- Automated backups (Postgres pg_dump cron)
- Monitoring/alerting
- Log aggregation
- CDN for static assets
- Server scaling / load balancing
- Email delivery setup (SMTP provider)
