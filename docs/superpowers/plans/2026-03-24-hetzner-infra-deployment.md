# Hetzner Infrastructure & Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy MailCraft to a Hetzner CX23 VPS at `emailcraft.contentor.app` with Docker Compose, Caddy auto-TLS, and Cloudflare DNS, provisioned by Terraform.

**Architecture:** Single VPS running Docker Compose: Caddy (auto-TLS reverse proxy), Django backend (gunicorn + WhiteNoise), two Vite frontends (nginx static), Postgres. Terraform provisions the server, firewall, and DNS. Manual deploy via SSH + git pull.

**Tech Stack:** Terraform (hcloud + cloudflare providers), Docker Compose, Caddy 2, gunicorn, WhiteNoise, nginx-alpine, Postgres 16

**Spec:** `docs/superpowers/specs/2026-03-24-hetzner-infra-deployment-design.md`

---

## Chunk 1: Django Production Hardening

### Task 1: Add WhiteNoise and production settings to Django

**Files:**
- Modify: `backend/requirements.txt` (add whitenoise, gunicorn)
- Modify: `backend/emailBuilder/settings.py` (STATIC_ROOT, WhiteNoise middleware, CORS fix, CSRF, secure settings, secret key validation)

All line numbers below refer to the **original** file state. Apply changes from bottom-up to avoid line number drift, or apply all changes at once.

- [ ] **Step 1: Add whitenoise and gunicorn to requirements.txt**

Add these two lines to the end of `backend/requirements.txt`:

```
gunicorn==23.0.0
whitenoise==6.8.2
```

- [ ] **Step 2: Add STATIC_ROOT to settings.py**

In `backend/emailBuilder/settings.py`, after line 119 (`STATIC_URL = 'static/'`), add:

```python
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

- [ ] **Step 3: Add WhiteNoise middleware to settings.py**

In the `MIDDLEWARE` list in `backend/emailBuilder/settings.py`, insert WhiteNoise between `SecurityMiddleware` (line 53) and `CorsMiddleware` (line 54). The result should be:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    ...
```

- [ ] **Step 4: Fix CORS config for production**

In `backend/emailBuilder/settings.py`, replace lines 159-160:

```python
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
```

with:

```python
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
if not DEBUG:
    _cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
```

- [ ] **Step 5: Add CSRF_TRUSTED_ORIGINS and secure settings**

In `backend/emailBuilder/settings.py`, after the CORS block (after step 4's additions), add:

```python

_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
```

- [ ] **Step 6: Add secret key validation**

In `backend/emailBuilder/settings.py`, after the `SECRET_KEY` definition (after line 22), add:

```python

if not DEBUG and SECRET_KEY.startswith('django-insecure'):
    raise ValueError('Set DJANGO_SECRET_KEY for production')
```

- [ ] **Step 7: Verify changes work locally**

Run from project root:

```bash
cd backend && pip install whitenoise gunicorn && python -c "import django; import os; os.environ['DJANGO_SETTINGS_MODULE']='emailBuilder.settings'; django.setup(); print('Settings OK')" && cd ..
```

Expected: `Settings OK` (no errors)

- [ ] **Step 8: Commit**

```bash
git add backend/requirements.txt backend/emailBuilder/settings.py
git commit -m "feat: add production Django settings (WhiteNoise, CORS, CSRF, secure cookies)"
```

---

## Chunk 2: Production Docker Files

### Task 2: Create .dockerignore and backend production Dockerfile

**Files:**
- Create: `.dockerignore` (project root)
- Create: `docker/backend.prod.Dockerfile`

- [ ] **Step 1: Create .dockerignore at project root**

All prod Dockerfiles use the project root as build context. Without `.dockerignore`, Docker sends the entire repo (`.git/`, `node_modules/`, `.env`, etc.) as context for every build.

Create `.dockerignore`:

```
.git/
.env
.env.prod
node_modules/
frontend/node_modules/
frontend-email-builder/node_modules/
venv/
*.sqlite3
infrastructure/
docs/
.DS_Store
__pycache__/
*.pyc
```

- [ ] **Step 2: Create backend.prod.Dockerfile**

Build context is the project root (`context: ..` in compose). All COPY paths are relative to the root.

Create `docker/backend.prod.Dockerfile`:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ARG DJANGO_SECRET_KEY=build-only-dummy-key
ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ENV DJANGO_DEBUG=False
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "emailBuilder.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

Note: `DJANGO_SECRET_KEY` build arg is a dummy value for `collectstatic` only. The real key is injected at runtime via `.env.prod`.

- [ ] **Step 3: Commit**

```bash
git add .dockerignore docker/backend.prod.Dockerfile
git commit -m "feat: add .dockerignore and backend production Dockerfile"
```

### Task 3: Create frontend production Dockerfile and nginx config

**Files:**
- Create: `docker/frontend.prod.Dockerfile`
- Create: `docker/frontend.nginx.conf`

- [ ] **Step 1: Create frontend.nginx.conf**

Create `docker/frontend.nginx.conf`:

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

- [ ] **Step 2: Create frontend.prod.Dockerfile**

Build context is the project root. COPY paths reference `frontend/` and `docker/`.

Create `docker/frontend.prod.Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Commit**

```bash
git add docker/frontend.prod.Dockerfile docker/frontend.nginx.conf
git commit -m "feat: add frontend production Dockerfile with nginx static serving"
```

### Task 4: Create builder production Dockerfile and nginx config

**Files:**
- Create: `docker/builder.prod.Dockerfile`
- Create: `docker/builder.nginx.conf`

- [ ] **Step 1: Create builder.nginx.conf**

Create `docker/builder.nginx.conf`:

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

- [ ] **Step 2: Create builder.prod.Dockerfile**

The builder's `frontend-email-builder/vite.config.ts` already has `base: '/builder/'` (line 21), so `npm run build` produces assets with the `/builder/` prefix. No `--base` flag needed. Caddy's `handle_path /builder/*` strips the prefix before proxying, so the builder nginx serves from root.

Create `docker/builder.prod.Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend-email-builder/package*.json ./
RUN npm ci
COPY frontend-email-builder/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/builder.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

- [ ] **Step 3: Commit**

```bash
git add docker/builder.prod.Dockerfile docker/builder.nginx.conf
git commit -m "feat: add builder production Dockerfile with nginx static serving"
```

### Task 5: Create Caddyfile

**Files:**
- Create: `docker/Caddyfile`

- [ ] **Step 1: Create the Caddyfile**

Routing logic mirrors `nginx/dev.conf`:
- `/api/*` → rewrite `/api/v1/*` → backend (dev nginx does `proxy_pass http://backend:8000/api/v1/;`)
- `/admin/*` → backend (path preserved)
- `/static/*` → backend (WhiteNoise serves collected static files)
- `/builder/*` → builder nginx (prefix stripped)
- `/*` → frontend nginx (catch-all)

The dev config also has `/media/*` → backend, but the project uses S3 presigned URLs for uploads, so `/media/` is not needed in production. Omitted intentionally.

Create `docker/Caddyfile`:

```
{$DOMAIN:localhost} {
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

Using `{$DOMAIN:localhost}` allows the domain to be set via env var, falling back to `localhost` for local testing.

- [ ] **Step 2: Commit**

```bash
git add docker/Caddyfile
git commit -m "feat: add Caddyfile with path-based routing and API rewrite"
```

### Task 6: Create production docker-compose

**Files:**
- Create: `docker/docker-compose.prod.yml`

- [ ] **Step 1: Create docker-compose.prod.yml**

Notes on the architecture:
- All builds use `context: ..` (project root) as build context, relying on `.dockerignore` to exclude irrelevant files.
- `env_file: ../.env.prod` injects env vars into the backend container at runtime.
- The `--env-file .env.prod` CLI flag (used in deploy commands) makes the same vars available for compose-level `${VAR}` substitution in postgres and caddy services.
- Service `builder` is renamed from `frontend_email_builder` (dev compose) for brevity.

Create `docker/docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-mailcraft}
      POSTGRES_USER: ${DB_USER:-mailcraft}
      POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-mailcraft} -d ${DB_NAME:-mailcraft}"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    build:
      context: ..
      dockerfile: docker/backend.prod.Dockerfile
    env_file:
      - ../.env.prod
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
    expose:
      - "8000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ..
      dockerfile: docker/frontend.prod.Dockerfile
    expose:
      - "80"
    restart: unless-stopped

  builder:
    build:
      context: ..
      dockerfile: docker/builder.prod.Dockerfile
    expose:
      - "80"
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN:-localhost}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - backend
      - frontend
      - builder
    restart: unless-stopped

volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

- [ ] **Step 2: Commit**

```bash
git add docker/docker-compose.prod.yml
git commit -m "feat: add production docker-compose with Caddy, gunicorn, and nginx"
```

### Task 7: Create .env.prod.example and update .gitignore

**Files:**
- Create: `docker/.env.prod.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env.prod.example**

Create `docker/.env.prod.example`:

```env
# MailCraft Production Environment
# Copy to project root as .env.prod and fill in real values.
# NEVER commit .env.prod to git.

# App
APP_ENV=prod
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=  # Generate: python3 -c "import secrets; print(secrets.token_urlsafe(64))"
DJANGO_ALLOWED_HOSTS=emailcraft.contentor.app

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=mailcraft
DB_USER=mailcraft
DB_PASSWORD=  # From terraform output or generate a strong password
DB_HOST=postgres
DB_PORT=5432

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://emailcraft.contentor.app
CSRF_TRUSTED_ORIGINS=https://emailcraft.contentor.app

# S3 (Hetzner Object Storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BUCKET_NAME_DEV=contentor-email-builder-dev
AWS_BUCKET_NAME_PROD=contentor-email-builder-prod
AWS_ENDPOINT=https://fsn1.your-objectstorage.com
AWS_S3_KEY_PREFIX=emailBuilder
AWS_REGION=fsn1

# Stripe
STRIPE_API_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=https://emailcraft.contentor.app/pricing?status=success
STRIPE_CANCEL_URL=https://emailcraft.contentor.app/pricing?status=cancelled

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Domain (used by Caddyfile)
DOMAIN=emailcraft.contentor.app
```

- [ ] **Step 2: Update root .gitignore**

Add these lines to `.gitignore`:

```
.env.prod
.dockerignore
infrastructure/.env
infrastructure/.terraform/
infrastructure/*.tfstate*
```

- [ ] **Step 3: Commit**

```bash
git add docker/.env.prod.example .gitignore
git commit -m "feat: add .env.prod.example template and update .gitignore for infra"
```

### Task 8: Verify Docker build locally

- [ ] **Step 1: Test that docker-compose.prod.yml parses correctly**

Run from project root:

```bash
DB_PASSWORD=test docker compose -f docker/docker-compose.prod.yml config 2>&1 | head -10
```

Expected: YAML output showing the parsed compose config (not a parse error). The `DB_PASSWORD=test` avoids the `required variable` error.

- [ ] **Step 2: Commit any fixes if needed**

---

## Chunk 3: Terraform Infrastructure

### Task 9: Create Terraform configuration

**Files:**
- Create: `infrastructure/main.tf`
- Create: `infrastructure/variables.tf`
- Create: `infrastructure/outputs.tf`
- Create: `infrastructure/.env.example`
- Create: `infrastructure/.gitignore`

- [ ] **Step 1: Create infrastructure/.gitignore**

Create `infrastructure/.gitignore`:

```
.env
.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl
```

- [ ] **Step 2: Create infrastructure/variables.tf**

Create `infrastructure/variables.tf`:

```hcl
variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  sensitive   = true
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone (root domain)"
  default     = "contentor.app"
}

variable "domain_prefix" {
  description = "Subdomain prefix for the app"
  default     = "emailcraft"
}

variable "server_type" {
  description = "Hetzner server type"
  default     = "cx23"
}

variable "location" {
  description = "Hetzner datacenter location"
  default     = "fsn1"
}
```

- [ ] **Step 3: Create infrastructure/main.tf**

Create `infrastructure/main.tf`:

```hcl
terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ---------- SSH key ----------

data "hcloud_ssh_keys" "all" {}

resource "hcloud_ssh_key" "default" {
  count      = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? 0 : 1
  name       = "default"
  public_key = file("~/.ssh/id_ed25519.pub")
}

locals {
  ssh_key_ids = length(data.hcloud_ssh_keys.all.ssh_keys) > 0 ? [data.hcloud_ssh_keys.all.ssh_keys[0].id] : [hcloud_ssh_key.default[0].id]
}

# ---------- Random password ----------

resource "random_password" "postgres" {
  length  = 24
  special = false
}

# ---------- Server ----------

resource "hcloud_server" "prod" {
  name        = "mailcraft-prod"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = local.ssh_key_ids

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # Install Docker
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Install git
    apt-get install -y git

    # Create app directory
    mkdir -p /opt/mailcraft

    # Enable Docker on boot
    systemctl enable docker
    systemctl start docker
  EOF
}

# ---------- Firewall ----------

resource "hcloud_firewall" "web" {
  name = "mailcraft-prod-fw"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "tcp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "udp"
    port            = "1-65535"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction       = "out"
    protocol        = "icmp"
    destination_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_firewall_attachment" "prod" {
  firewall_id = hcloud_firewall.web.id
  server_ids  = [hcloud_server.prod.id]
}

# ---------- DNS ----------

data "cloudflare_zone" "zone" {
  name = var.cloudflare_zone_name
}

resource "cloudflare_record" "app" {
  zone_id = data.cloudflare_zone.zone.id
  name    = var.domain_prefix
  content = hcloud_server.prod.ipv4_address
  type    = "A"
  ttl     = 1
  proxied = false
}
```

- [ ] **Step 4: Create infrastructure/outputs.tf**

Create `infrastructure/outputs.tf`:

```hcl
output "server_ipv4" {
  value = hcloud_server.prod.ipv4_address
}

output "ssh_command" {
  value = "ssh root@${hcloud_server.prod.ipv4_address}"
}

output "app_url" {
  value = "https://${var.domain_prefix}.${var.cloudflare_zone_name}"
}

output "dns_record" {
  value = "${var.domain_prefix}.${var.cloudflare_zone_name}"
}

output "postgres_password" {
  value     = random_password.postgres.result
  sensitive = true
}
```

- [ ] **Step 5: Create infrastructure/.env.example**

Create `infrastructure/.env.example`:

```env
# Copy to .env and fill in real values
HETZNER_API_TOKEN=
CLOUDFLARE_API_TOKEN=
```

- [ ] **Step 6: Commit**

```bash
git add infrastructure/
git commit -m "feat: add Terraform config for Hetzner server, firewall, and Cloudflare DNS"
```

---

## Chunk 4: Provision and Deploy

### Task 10: Run Terraform to provision infrastructure

- [ ] **Step 1: Create infrastructure/.env with real tokens**

The user has added `CLOUDFLARE_API_TOKEN` and `HETZNER_API_TOKEN` to the root `.env`. Create `infrastructure/.env`:

```bash
cd infrastructure
cp .env.example .env
```

Then edit `infrastructure/.env` and fill in the real `HETZNER_API_TOKEN` and `CLOUDFLARE_API_TOKEN` values from the root `.env`.

- [ ] **Step 2: Initialize Terraform**

```bash
cd infrastructure
terraform init
```

Expected: "Terraform has been successfully initialized!"

- [ ] **Step 3: Plan the deployment**

```bash
cd infrastructure
terraform plan \
  -var="hcloud_token=$(grep HETZNER_API_TOKEN .env | cut -d= -f2)" \
  -var="cloudflare_api_token=$(grep CLOUDFLARE_API_TOKEN .env | cut -d= -f2)"
```

Expected: Plan showing 6 resources to create:
- `hcloud_server.prod`
- `hcloud_firewall.web`
- `hcloud_firewall_attachment.prod`
- `cloudflare_record.app`
- `random_password.postgres`
- Possibly `hcloud_ssh_key.default` (if no existing keys)

Review the plan carefully before applying.

- [ ] **Step 4: Apply Terraform**

```bash
cd infrastructure
terraform apply \
  -var="hcloud_token=$(grep HETZNER_API_TOKEN .env | cut -d= -f2)" \
  -var="cloudflare_api_token=$(grep CLOUDFLARE_API_TOKEN .env | cut -d= -f2)"
```

Type `yes` when prompted. Note the outputs:
- `server_ipv4` — save this
- `ssh_command` — use this to connect
- `postgres_password` — use `terraform output -raw postgres_password` to get it

- [ ] **Step 5: Verify SSH access**

```bash
ssh root@<server-ip>
```

Expected: SSH into the server. Verify Docker is installed:

```bash
docker --version
docker compose version
```

### Task 11: Deploy application to server

- [ ] **Step 1: Clone repo on server**

SSH into the server and clone:

```bash
ssh root@<server-ip>
cd /opt/mailcraft
git clone <your-repo-url> .
```

- [ ] **Step 2: Create .env.prod on server**

```bash
cp docker/.env.prod.example .env.prod
```

Edit `.env.prod` and fill in all values. For `DB_PASSWORD`, use the terraform output:

```bash
# On your local machine:
cd infrastructure && terraform output -raw postgres_password
```

For `DJANGO_SECRET_KEY`, generate on the server:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

Fill in the S3, Stripe, and Google OAuth values from your existing credentials.

- [ ] **Step 3: Build and start the stack**

```bash
cd /opt/mailcraft
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up --build -d
```

Expected: All 5 services start. Check with:

```bash
docker compose -f docker/docker-compose.prod.yml ps
```

All services should show "Up" status.

- [ ] **Step 4: Run migrations and create superuser**

```bash
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod exec backend python manage.py migrate
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod exec backend python manage.py createsuperuser
```

- [ ] **Step 5: Verify the site is live**

Visit in browser:
- `https://emailcraft.contentor.app` — should show the site frontend
- `https://emailcraft.contentor.app/builder/` — should show the email builder
- `https://emailcraft.contentor.app/api/templates/` — should return API response (or auth error)
- `https://emailcraft.contentor.app/admin/` — should show Django admin login

If any route fails, check Caddy logs:

```bash
docker compose -f docker/docker-compose.prod.yml logs caddy
```

- [ ] **Step 6: Verify HTTPS certificate**

```bash
curl -I https://emailcraft.contentor.app
```

Expected: `HTTP/2 200` with valid TLS (Caddy auto-provisions Let's Encrypt cert).
