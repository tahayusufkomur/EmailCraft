# MailCraft — Security & Source Code Protection Plan

## Overview

MailCraft's core IP is the drag-and-drop editor and the email HTML rendering engine. Since the product is delivered via iframe (hosted SaaS), the source code never ships to the customer — but additional layers are needed to prevent scraping, reverse engineering, and unauthorized access.

---

## 1. Source Code Protection

### Build-Time Obfuscation

Production builds go through multiple protection layers:

```
TypeScript → Vite/Webpack build → Tree-shaking → Minification → Obfuscation → Deploy
```

**Obfuscation config (`javascript-obfuscator`):**
- Variable and function name mangling
- String literal encoding (string array rotation + RC4 encoding)
- Control flow flattening (makes code logic unreadable)
- Dead code injection (adds fake branches)
- Debug protection (anti-debugging traps)
- Console output disabled

**Critical rules:**
- Source maps are NEVER deployed to production
- Source maps are stored in a private S3 bucket, accessible only for error tracking (e.g., Sentry)
- Chunk splitting distributes code across multiple files — no single bundle contains the full app

### Runtime Protection

```javascript
// Detect DevTools opening (production only)
const threshold = 160;
setInterval(() => {
  const start = performance.now();
  debugger; // triggers pause if DevTools open
  if (performance.now() - start > threshold) {
    // DevTools detected — log event, optionally degrade
  }
}, 1000);

// Disable console methods in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
}

// Disable right-click context menu
document.addEventListener('contextmenu', e => e.preventDefault());
```

> **Note:** These are deterrents, not absolute protections. A determined reverse engineer can bypass them. The real protection is that the business logic (HTML export engine) lives on the backend.

---

## 2. iframe Security

### Domain Whitelisting

Every Organization has an `allowed_origins` list. The iframe will only load for whitelisted domains.

**Server-side enforcement (Django middleware):**

```python
class OriginWhitelistMiddleware:
    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', '')
        api_key = request.META.get('HTTP_X_API_KEY', '')

        org = Organization.objects.filter(
            api_keys__key_hash=hash(api_key),
            api_keys__is_active=True
        ).first()

        if not org:
            return JsonResponse({"error": "Invalid API key"}, status=401)

        if origin not in org.allowed_origins:
            return JsonResponse({"error": "Unauthorized origin"}, status=403)

        request.org = org  # inject tenant context
        return self.get_response(request)
```

**Response headers:**

```
Content-Security-Policy: frame-ancestors https://customer1.com https://customer2.com
X-Frame-Options: ALLOW-FROM https://customer1.com
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### iframe Sandbox Attributes

The loader script creates the iframe with restrictive sandbox:

```html
<iframe
  src="https://app.mailcraft.io/editor?token=SESSION_TOKEN"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  referrerpolicy="strict-origin"
  loading="lazy"
></iframe>
```

---

## 3. iframe ↔ Host Communication

All communication between the iframe and the parent window uses `postMessage` with strict origin validation on both sides.

```javascript
// Inside iframe (MailCraft editor)
function sendToParent(type, payload) {
  const allowedOrigin = window.__MAILCRAFT_CONFIG__.parentOrigin;
  window.parent.postMessage(
    { source: "mailcraft", type, payload },
    allowedOrigin  // never use "*"
  );
}

// Host side (developer's app) — loader script
window.addEventListener("message", (event) => {
  if (event.origin !== "https://app.mailcraft.io") return;
  if (event.data?.source !== "mailcraft") return;

  switch (event.data.type) {
    case "MAILCRAFT_READY":
      // Editor loaded
      break;
    case "MAILCRAFT_SAVE":
      config.onSave(event.data.payload); // { html, json }
      break;
    case "MAILCRAFT_ERROR":
      config.onError?.(event.data.payload);
      break;
  }
});
```

**Message types:**

| Direction | Type | Payload |
|-----------|------|---------|
| Host → iframe | `MAILCRAFT_INIT` | `{ variables, templateJson }` |
| Host → iframe | `MAILCRAFT_LOAD_TEMPLATE` | `{ json }` |
| iframe → Host | `MAILCRAFT_READY` | `{}` |
| iframe → Host | `MAILCRAFT_SAVE` | `{ html, json }` |
| iframe → Host | `MAILCRAFT_AUTO_SAVE` | `{ json }` |
| iframe → Host | `MAILCRAFT_ERROR` | `{ code, message }` |

---

## 4. API Key Management

### Key Structure

```
Format: mc_{env}_{32_random_chars}
Examples:
  mc_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  mc_test_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### Key Storage

- API keys are **never stored in plaintext**
- On creation: show the key once to the user, store `SHA-256(key)` in database
- Validation: hash incoming key, compare to stored hash
- Key prefix (`mc_live_`, `mc_test_`) stored separately for identification

### Key Types

| Type | Allowed Origins | Rate Limit | Purpose |
|------|----------------|------------|---------|
| `mc_test_` | `localhost:*`, `127.0.0.1:*` | 100 req/min | Development & testing |
| `mc_live_` | Whitelisted domains only | Plan-dependent | Production use |

### Key Lifecycle

```
Create → Active → (optional: Rotate) → Revoke
```

- **Rotation:** Generate new key, old key stays active for 24h grace period, then auto-revokes
- **Revoke:** Immediate deactivation, all sessions using this key are invalidated
- **Max keys per org:** 5 live + 5 test

---

## 5. S3 & File Upload Security

### Upload Flow

```
Client requests presigned URL → Backend validates (auth, file type, size)
→ Backend generates S3 presigned PUT URL (15 min expiry)
→ Client uploads directly to S3 → Client sends confirmation
→ Backend verifies upload exists in S3 → Stores record in DB
```

### Restrictions

| Rule | Value |
|------|-------|
| Allowed MIME types | `image/png`, `image/jpeg`, `image/gif`, `image/webp` |
| Max file size (free) | 5 MB per image |
| Max file size (pro) | 25 MB per image |
| Total storage (free) | 100 MB per org |
| Total storage (pro) | 5 GB per org |
| Presigned URL expiry | 15 minutes |
| File name | Sanitized + UUID prefix to prevent collisions |

### S3 Bucket Policy

- Bucket is **private** (no public access)
- Images served through CloudFront with signed URLs or signed cookies
- Each org's files stored under `uploads/{org_id}/` prefix
- Lifecycle rule: delete orphaned files (uploaded but never linked to a template) after 7 days

### Content Validation

- Backend checks `Content-Type` header matches actual file content (magic bytes)
- Image dimensions checked post-upload (reject if > 4000x4000px)
- SVG uploads are **blocked** (XSS vector)

---

## 6. Tenant Data Isolation

### Multi-Tenancy Model

MailCraft uses **shared database, shared schema** with `org_id` filtering on every query.

```python
# Django manager that auto-filters by org
class TenantManager(models.Manager):
    def for_org(self, org):
        return self.filter(org=org)

# Every view uses org from middleware
class TemplateViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Template.objects.for_org(self.request.org)

    def perform_create(self, serializer):
        serializer.save(org=self.request.org)
```

**Rules:**
- Every model with tenant data has `org_id` as a non-nullable FK
- Database indexes on `(org_id, id)` for all tenant tables
- Gallery templates (`is_gallery=True`) are global and read-only for all orgs
- No raw SQL without explicit `WHERE org_id = %s`
- Django admin restricted to superusers with MFA

---

## 7. Rate Limiting

| Endpoint | Free Plan | Pro Plan |
|----------|-----------|----------|
| Template CRUD | 60 req/min | 300 req/min |
| Image upload | 10 req/min | 60 req/min |
| HTML export | 30 req/min | 200 req/min |
| Auth/session | 10 req/min | 10 req/min |

Implemented via `django-ratelimit` or Redis-based token bucket. Rate limit headers returned:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707312000
```

---

## 8. Input Validation & XSS Prevention

### Template JSON Validation

- JSON schema validation on every save (block types, allowed properties)
- HTML content in text blocks sanitized (strip `<script>`, `on*` attributes)
- Variable names validated against allowlist: `^[a-zA-Z_][a-zA-Z0-9_]{0,50}$`
- URL fields validated (must be `https://` or `{{variable}}`)
- Maximum template size: 2 MB JSON

### HTML Export Sanitization

- Server-side HTML rendering — no user-supplied HTML passes through unsanitized
- All text content is HTML-entity-encoded before insertion
- URLs in `href` and `src` validated (no `javascript:` protocol)
- CSS properties restricted to a safe allowlist (no `expression()`, `url()` with data URIs)

---

## 9. Monitoring & Incident Response

### Security Logging

- All authentication events (success + failure) logged with IP, user-agent, origin
- Rate limit violations logged and alerted
- Unusual patterns detected: rapid key creation, mass template export, origin mismatches
- S3 access logs enabled for audit trail

### Alerting

- 5+ failed auth attempts from same IP in 1 min → temporary IP block
- API key used from non-whitelisted origin → alert + log
- Storage usage > 80% of plan limit → alert org admin
