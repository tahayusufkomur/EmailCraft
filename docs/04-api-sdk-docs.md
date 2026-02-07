# MailCraft — API & SDK Documentation Plan

## SDK Integration (Developer-Facing)

### Quick Start

```html
<!-- 1. Include the loader script -->
<script src="https://cdn.mailcraft.io/loader.js"></script>

<!-- 2. Add a container element -->
<div id="email-builder" style="height: 700px;"></div>

<!-- 3. Initialize -->
<script>
  MailCraft.init({
    apiKey: "mc_live_your_api_key_here",
    container: "#email-builder",
    variables: [
      { key: "first_name", label: "First Name", defaultValue: "Customer" },
      { key: "company_name", label: "Company", defaultValue: "Acme Inc" },
      { key: "unsubscribe_url", label: "Unsubscribe Link", type: "url" }
    ],
    onSave: (output) => {
      console.log(output.html);  // Email-ready HTML with {{variables}}
      console.log(output.json);  // Re-editable template structure
    },
    onError: (error) => {
      console.error(error.code, error.message);
    }
  });
</script>
```

### Init Config Reference

```typescript
interface MailCraftConfig {
  apiKey: string;                    // Required. Your API key (mc_live_* or mc_test_*)
  container: string | HTMLElement;   // Required. CSS selector or DOM element
  variables?: Variable[];            // Custom variables available in the editor
  templateJson?: object;             // Pre-load a template for editing
  locale?: string;                   // UI language: "en" (default), "tr", "de"
  theme?: {
    primaryColor?: string;           // Brand color for editor UI
    borderRadius?: string;           // UI border radius
  };
  onSave?: (output: MailCraftOutput) => void;
  onAutoSave?: (output: MailCraftOutput) => void;
  onError?: (error: MailCraftError) => void;
  onReady?: () => void;              // Fired when editor is fully loaded
}

interface Variable {
  key: string;           // Template placeholder: {{key}}
  label: string;         // Display label in the editor UI
  defaultValue?: string; // Preview value shown in the editor
  type?: "text" | "url"; // Default: "text"
}

interface MailCraftOutput {
  html: string;  // Email-compatible HTML with {{variable}} placeholders
  json: object;  // Template JSON for re-editing
}

interface MailCraftError {
  code: string;     // e.g. "INVALID_API_KEY", "UNAUTHORIZED_ORIGIN"
  message: string;  // Human-readable error description
}
```

### SDK Methods

```javascript
// Initialize the editor
MailCraft.init(config);

// Load a template programmatically (after init)
MailCraft.loadTemplate(templateJson);

// Export current template
MailCraft.export().then((output) => {
  // output.html, output.json
});

// Destroy the editor and clean up
MailCraft.destroy();
```

### Events via postMessage

If you prefer direct postMessage over callbacks:

```javascript
window.addEventListener("message", (event) => {
  if (event.origin !== "https://app.mailcraft.io") return;
  if (event.data?.source !== "mailcraft") return;

  switch (event.data.type) {
    case "MAILCRAFT_READY":      break;
    case "MAILCRAFT_SAVE":       break; // event.data.payload = { html, json }
    case "MAILCRAFT_AUTO_SAVE":  break; // event.data.payload = { json }
    case "MAILCRAFT_ERROR":      break; // event.data.payload = { code, message }
  }
});
```

---

## REST API Reference

**Base URL:** `https://api.mailcraft.io/v1`

**Authentication:** All requests require `X-API-Key` header.

```
X-API-Key: mc_live_your_api_key_here
```

### Error Format

All errors follow the same structure:

```json
{
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The provided API key is invalid or has been revoked."
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | Key missing, invalid, or revoked |
| `UNAUTHORIZED_ORIGIN` | 403 | Request origin not in whitelist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `TEMPLATE_NOT_FOUND` | 404 | Template doesn't exist or belongs to another org |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `STORAGE_LIMIT_EXCEEDED` | 413 | Org has exceeded storage quota |
| `FILE_TOO_LARGE` | 413 | Upload exceeds max file size |
| `INVALID_FILE_TYPE` | 415 | File type not allowed |

---

### POST /api/v1/auth/session

Create a session token for iframe initialization.

**Request:**
```json
{
  "origin": "https://app.customer.com"
}
```

**Response (200):**
```json
{
  "token": "sess_a1b2c3...",
  "expires_at": "2026-02-07T13:00:00Z",
  "config": {
    "plan": "pro",
    "max_upload_size_bytes": 26214400,
    "storage_used_bytes": 52428800,
    "storage_limit_bytes": 5368709120
  }
}
```

---

### GET /api/v1/templates

List templates for the authenticated organization.

**Query params:**
- `page` (int, default 1)
- `per_page` (int, default 20, max 100)
- `search` (string, optional — search by name)

**Response (200):**
```json
{
  "data": [
    {
      "id": "tpl_abc123",
      "name": "Welcome Email",
      "thumbnail_url": "https://assets.mailcraft.io/thumbs/tpl_abc123.png",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-05T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 42
  }
}
```

---

### POST /api/v1/templates

Save a new template.

**Request:**
```json
{
  "name": "February Newsletter",
  "json_data": { ... }
}
```

**Response (201):**
```json
{
  "id": "tpl_def456",
  "name": "February Newsletter",
  "created_at": "2026-02-07T12:00:00Z"
}
```

---

### PUT /api/v1/templates/:id

Update an existing template.

**Request:**
```json
{
  "name": "February Newsletter v2",
  "json_data": { ... }
}
```

**Response (200):**
```json
{
  "id": "tpl_def456",
  "name": "February Newsletter v2",
  "updated_at": "2026-02-07T12:30:00Z"
}
```

---

### DELETE /api/v1/templates/:id

Delete a template. Also deletes orphaned images linked only to this template.

**Response (204):** No content.

---

### GET /api/v1/gallery

List prebuilt gallery templates (global, read-only).

**Query params:**
- `category` (string, optional): `welcome`, `newsletter`, `promotional`, `transactional`, `event`

**Response (200):**
```json
{
  "data": [
    {
      "id": "gallery_001",
      "name": "Welcome Email",
      "category": "welcome",
      "thumbnail_url": "https://assets.mailcraft.io/gallery/welcome.png",
      "json_data": { ... }
    }
  ]
}
```

---

### POST /api/v1/upload/presign

Get a presigned S3 URL for direct image upload.

**Request:**
```json
{
  "filename": "hero-banner.png",
  "content_type": "image/png",
  "file_size": 245760
}
```

**Response (200):**
```json
{
  "upload_url": "https://s3.amazonaws.com/mailcraft-uploads/...",
  "file_url": "https://assets.mailcraft.io/uploads/org_123/img_abc.png",
  "expires_at": "2026-02-07T12:15:00Z"
}
```

**Upload flow:**
```javascript
// 1. Get presigned URL
const { upload_url, file_url } = await fetch("/api/v1/upload/presign", { ... });

// 2. Upload directly to S3
await fetch(upload_url, {
  method: "PUT",
  headers: { "Content-Type": file.type },
  body: file
});

// 3. Use file_url in the template
```

---

### POST /api/v1/export/html

Convert template JSON to email-compatible HTML.

**Request:**
```json
{
  "json_data": { ... },
  "variables_mode": "placeholders"
}
```

`variables_mode`:
- `"placeholders"` (default): output contains `{{first_name}}`
- `"defaults"`: output renders with default values (for preview)

**Response (200):**
```json
{
  "html": "<!DOCTYPE html><html>...",
  "warnings": [
    "Image at block 3 exceeds 1MB — may load slowly in email clients"
  ]
}
```

---

## Rate Limits

All responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707312000
```

| Endpoint Group | Free Plan | Pro Plan |
|---------------|-----------|----------|
| Templates (CRUD) | 60 req/min | 300 req/min |
| Image upload | 10 req/min | 60 req/min |
| HTML export | 30 req/min | 200 req/min |
| Auth/session | 10 req/min | 10 req/min |

---

## Variable Usage in HTML Output

The HTML export produces `{{variable_name}}` placeholders. The developer replaces them server-side before sending:

```python
# Python example
html = mailcraft_html_output
html = html.replace("{{first_name}}", customer.first_name)
html = html.replace("{{unsubscribe_url}}", generate_unsubscribe_url(customer))
send_email(to=customer.email, html_body=html)
```

```javascript
// Node.js example
let html = mailcraftOutput.html;
html = html.replace(/\{\{first_name\}\}/g, customer.firstName);
html = html.replace(/\{\{unsubscribe_url\}\}/g, generateUnsubscribeUrl(customer));
await sendEmail({ to: customer.email, html });
```
