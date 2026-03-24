# Premium Template Gating — Design Spec

**Date:** 2026-03-24
**Scope:** Backend `templates_api/views.py` + Frontend `frontend-email-builder/`

## Overview

Free users should see premium templates in the gallery but cannot load them into the editor. Currently the backend excludes premium templates entirely for free users. Change: return all templates to all users, gate loading on the frontend.

---

## Backend

### Remove `filter_gallery_by_plan`

**File:** `backend/templates_api/views.py`

Delete the `filter_gallery_by_plan` function (lines 67–72) and remove both call sites:

1. `TemplateViewSet.get_queryset()` (line 42) — change to just `return Template.objects.visible_to_org(self.request.org)` for list/retrieve
2. `gallery_list` view (line 61) — remove the `filter_gallery_by_plan` call, just use `queryset` directly

Also remove the `billing_organization_for_org` import if it's no longer used in this file (check: `export_html` and `render_template` and `presign_upload` use it, so it stays).

---

## Frontend

### TemplateGallery.tsx

**Premium badge on TemplateCard:**
- Add a small "Premium" label positioned absolutely in the top-right corner of the `.thumbnailWrap` div
- Style: semi-transparent dark background, white text, small font, border-radius pill
- Only shown when `item.is_premium` is true

**Click gating:**
- Read plan from `useConfigStore((s) => s.plan)` in the `TemplateGallery` component
- In `handleSelectSaved`: before the API call, check `if (item.is_premium && plan === 'free')`:
  - Set a new `premiumNotice` state (string or null)
  - Display it as a notice banner at the top of the gallery content area (amber/warning style, distinct from the red error banner)
  - Auto-dismiss after 3 seconds via `setTimeout`
  - Return early — don't fetch or load the template
- Message: "Upgrade your plan to use premium templates"

### No new files, components, or dependencies needed

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `backend/templates_api/views.py` | Remove `filter_gallery_by_plan` function and both call sites |
| `frontend-email-builder/src/components/Gallery/TemplateGallery.tsx` | Add premium badge, plan check on click, notice banner with auto-dismiss |
