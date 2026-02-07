# MailCraft — Database & Data Model Plan

## Overview

PostgreSQL with Django ORM. Shared database, shared schema multi-tenancy with `org_id` filtering on all tenant-scoped tables.

---

## Entity Relationship Diagram

```
Organization (1) ──── (*) ApiKey
     │
     ├── (1) ──── (*) Template
     │
     └── (1) ──── (*) UploadedImage
```

---

## Models

### Organization

The top-level tenant entity. Every API key, template, and uploaded image belongs to an organization.

```python
class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    plan = models.CharField(max_length=20, choices=[
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ], default='free')
    allowed_origins = models.JSONField(default=list)  # ["https://app.customer.com"]
    storage_used_bytes = models.BigIntegerField(default=0)
    storage_limit_bytes = models.BigIntegerField(default=104857600)  # 100MB free
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'
```

### ApiKey

API keys are hashed before storage. The prefix is stored separately for display.

```python
class ApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='api_keys')
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)  # SHA-256
    key_prefix = models.CharField(max_length=20)  # "mc_live_a1b2" (first 12 chars for display)
    environment = models.CharField(max_length=10, choices=[
        ('live', 'Live'),
        ('test', 'Test'),
    ])
    scope = models.CharField(max_length=20, choices=[
        ('full', 'Full Access'),
        ('readonly', 'Read Only'),
    ], default='full')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True)

    class Meta:
        db_table = 'api_keys'
        indexes = [
            models.Index(fields=['key_hash']),
            models.Index(fields=['org', 'is_active']),
        ]
```

### Template

Stores the JSON block structure and metadata. `json_data` uses PostgreSQL's `jsonb` type for efficient querying.

```python
class Template(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    org = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='templates', null=True, blank=True  # null for gallery templates
    )
    name = models.CharField(max_length=255)
    json_data = models.JSONField()  # The full template block structure
    thumbnail_url = models.URLField(blank=True, null=True)
    is_gallery = models.BooleanField(default=False, db_index=True)
    category = models.CharField(max_length=50, blank=True, choices=[
        ('welcome', 'Welcome'),
        ('newsletter', 'Newsletter'),
        ('promotional', 'Promotional'),
        ('transactional', 'Transactional'),
        ('event', 'Event'),
    ])
    is_draft = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'templates'
        indexes = [
            models.Index(fields=['org', 'created_at']),
            models.Index(fields=['is_gallery', 'category']),
        ]
        ordering = ['-updated_at']
```

### UploadedImage

Tracks all images uploaded to S3. Used for storage accounting and cleanup.

```python
class UploadedImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='images')
    s3_key = models.CharField(max_length=500, unique=True)  # uploads/org_123/img_abc.png
    url = models.URLField()  # CloudFront URL
    file_size = models.IntegerField()  # bytes
    content_type = models.CharField(max_length=50)  # image/png, image/jpeg
    width = models.IntegerField(null=True)
    height = models.IntegerField(null=True)
    is_orphaned = models.BooleanField(default=True)  # True until linked to a template
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'uploaded_images'
        indexes = [
            models.Index(fields=['org', 'created_at']),
            models.Index(fields=['is_orphaned', 'created_at']),  # For cleanup job
        ]
```

---

## Template JSON Schema

The `json_data` field stores the complete template structure:

```json
{
  "version": 1,
  "settings": {
    "backgroundColor": "#ffffff",
    "contentWidth": 600,
    "defaultFont": "Arial",
    "defaultFontSize": 14,
    "defaultColor": "#333333"
  },
  "header": {
    "blocks": [...]
  },
  "body": {
    "blocks": [
      {
        "id": "blk_abc123",
        "type": "text",
        "data": {
          "html": "<p>Hello <strong>{{first_name}}</strong>,</p>",
          "variables": ["first_name"]
        },
        "style": {
          "padding": { "top": 10, "right": 20, "bottom": 10, "left": 20 },
          "backgroundColor": null
        }
      },
      {
        "id": "blk_def456",
        "type": "image",
        "data": {
          "src": "https://assets.mailcraft.io/uploads/org_123/hero.png",
          "alt": "Hero banner",
          "link": "https://example.com",
          "width": 600
        },
        "style": {
          "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 },
          "alignment": "center"
        }
      },
      {
        "id": "blk_ghi789",
        "type": "columns",
        "data": {
          "columnCount": 2,
          "columnRatio": [50, 50],
          "columns": [
            { "blocks": [...] },
            { "blocks": [...] }
          ]
        },
        "style": {
          "gap": 10,
          "stackOnMobile": true
        }
      },
      {
        "id": "blk_jkl012",
        "type": "button",
        "data": {
          "text": "Shop Now",
          "url": "https://example.com/shop",
        },
        "style": {
          "backgroundColor": "#007bff",
          "color": "#ffffff",
          "borderRadius": 4,
          "padding": { "top": 12, "right": 24, "bottom": 12, "left": 24 },
          "alignment": "center",
          "fullWidth": false
        }
      },
      {
        "id": "blk_mno345",
        "type": "divider",
        "data": {},
        "style": {
          "lineStyle": "solid",
          "lineColor": "#cccccc",
          "lineThickness": 1,
          "spacing": 20
        }
      },
      {
        "id": "blk_pqr678",
        "type": "social",
        "data": {
          "platforms": [
            { "type": "facebook", "url": "https://facebook.com/example" },
            { "type": "twitter", "url": "https://x.com/example" },
            { "type": "instagram", "url": "https://instagram.com/example" }
          ]
        },
        "style": {
          "iconSize": 32,
          "iconStyle": "colored",
          "layout": "horizontal",
          "alignment": "center",
          "spacing": 10
        }
      }
    ]
  },
  "footer": {
    "blocks": [...]
  }
}
```

---

## Migrations Strategy

- Django's built-in migration system
- All migrations version-controlled in Git
- No manual SQL in production — always through Django migrations
- `json_data` schema changes handled at application level (version field in JSON)
- Backward-compatible JSON schema: new fields have defaults, old templates still load

---

## Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| `api_keys` | `key_hash` | Fast key lookup on every request |
| `api_keys` | `(org, is_active)` | List active keys per org |
| `templates` | `(org, created_at)` | List templates per org, sorted |
| `templates` | `(is_gallery, category)` | Gallery listing |
| `uploaded_images` | `(org, created_at)` | List images per org |
| `uploaded_images` | `(is_orphaned, created_at)` | Cleanup job |

---

## Maintenance Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Orphan image cleanup | Daily | Delete `UploadedImage` where `is_orphaned=True` and `created_at` > 7 days. Delete corresponding S3 objects. |
| Storage recalculation | Hourly | Recalculate `org.storage_used_bytes` from `SUM(images.file_size)` |
| Inactive key cleanup | Weekly | Soft-delete keys not used in 90+ days (notify org first) |
| Template backup | Daily | Dump all templates to S3 backup bucket |
