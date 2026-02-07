# MailCraft — Technical Architecture Plan

## Project Summary

MailCraft is an embeddable email template builder widget delivered as a hosted SaaS via iframe. Developers integrate it into their own applications using a small JS loader script and an API key. End users design email templates via drag-and-drop; the output is email-friendly HTML + JSON (for re-editing). MailCraft does NOT send emails — it only builds templates.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend (Widget) | React + TypeScript | Component-based, strong ecosystem for DnD editors |
| Backend | Python / Django + DRF | Rapid development, proven ORM, built-in admin |
| Database | PostgreSQL | Relational integrity, JSON support for template data |
| File Storage | AWS S3 + CloudFront | Scalable image hosting, presigned uploads |
| Infrastructure | AWS (Lambda optional) | Existing expertise, cost-effective |
| Distribution | iframe embed (hosted) | Source code protection, centralized updates |

## Monetization

SaaS model with API key access control. Pricing TBD (usage-based or tiered plans).

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│  Customer's Application                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │  <iframe src="app.mailcraft.io/editor?t=TOKEN">│  │
│  │                                                │  │
│  │  ┌─────────┐ ┌─────────────────┐ ┌──────────┐ │  │
│  │  │  Block  │ │     Canvas      │ │  Style   │ │  │
│  │  │  Panel  │ │  (Drag & Drop)  │ │  Panel   │ │  │
│  │  │  (Left) │ │                 │ │  (Right) │ │  │
│  │  └─────────┘ └─────────────────┘ └──────────┘ │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Developer Backend:                                  │
│  output.html → replace {{variables}} → send email    │
└──────────────────────────────────────────────────────┘
           │
           │  API Key + Origin validation
           ▼
┌──────────────────────────────────────┐
│  MailCraft Backend (Django + DRF)    │
│                                      │
│  Middleware:                          │
│  ├── API Key auth                    │
│  ├── Origin whitelist check          │
│  ├── Rate limiter                    │
│  └── Tenant context injection        │
│                                      │
│  Endpoints:                          │
│  ├── /api/auth/session    (init)     │
│  ├── /api/templates       (CRUD)     │
│  ├── /api/gallery         (prebuilt) │
│  ├── /api/upload/presign  (S3)       │
│  └── /api/export/html     (render)   │
│                                      │
│  PostgreSQL ──── S3 (images)         │
└──────────────────────────────────────┘
```

---

## Request Flow

### 1. Widget Initialization

```
Developer's page loads → loader script runs
  → POST /api/auth/session { apiKey, origin }
  → Backend validates key + origin
  → Returns session token + config (variables, plan limits)
  → Loader injects iframe with token as URL param
  → iframe loads React editor app
```

### 2. Template Editing

```
User drags block → local state update (React)
User edits block → local state update
User uploads image → POST /api/upload/presign → S3 direct upload → URL stored in block
Auto-save every 30s → POST /api/templates { json_data }
```

### 3. Template Export

```
User clicks "Save" / "Export"
  → Frontend sends JSON to POST /api/export/html
  → Backend converts JSON → email-compatible HTML
     (inline CSS, table layout, VML fallbacks)
  → Returns { html, json }
  → iframe sends postMessage to parent window
  → Developer's onSave callback receives output
```

---

## Deployment Architecture

```
                    CloudFront CDN
                    ├── app.mailcraft.io (React SPA)
                    └── assets.mailcraft.io (uploaded images)
                           │
                           ▼
                    ALB / API Gateway
                           │
                           ▼
                    Django App (ECS Fargate or EC2)
                           │
                    ┌──────┴──────┐
                    │             │
               PostgreSQL     S3 Bucket
               (RDS)         (private)
```

### Environment Setup

| Environment | Purpose | Database |
|-------------|---------|----------|
| Development | Local dev + testing | Local PostgreSQL |
| Staging | Pre-production testing | RDS (separate instance) |
| Production | Live customers | RDS (Multi-AZ) |

---

## Key Technical Decisions

### Why iframe over npm package?

1. **Source code protection** — code never leaves your server
2. **Version control** — push updates without customer action
3. **Backend coupling** — S3 upload, HTML export run server-side
4. **SaaS control** — enforce API key, rate limits, plan restrictions

### Why server-side HTML export?

1. **Protection** — the email rendering engine is core IP
2. **Consistency** — guaranteed output regardless of client environment
3. **Validation** — server sanitizes JSON before rendering (XSS prevention)
4. **Tracking** — know which templates are exported (analytics)

### Why JSON + HTML dual output?

1. **JSON** — re-editable, the editor can reload and continue editing
2. **HTML** — final rendered output, ready for email sending after variable replacement
3. Developer stores JSON for future editing, uses HTML for sending

---

## Third-Party Dependencies (Frontend)

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag and drop (lightweight, accessible) |
| `tiptap` or `slate` | Rich text editing within text blocks |
| `zustand` or `useReducer` | Editor state management |
| `juice` (if client-side preview) | Inline CSS for preview only |

---

## Scalability Considerations

- **Stateless backend** — session token carries org context, easy horizontal scaling
- **S3 for all media** — no file storage on app servers
- **CDN for static assets** — React bundle served from CloudFront
- **Database indexing** — org_id on all tenant tables for fast filtered queries
- **Connection pooling** — PgBouncer for PostgreSQL connections under load
