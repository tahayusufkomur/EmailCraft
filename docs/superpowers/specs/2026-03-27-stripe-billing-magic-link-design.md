# Stripe Billing & Magic Link Auth — Design Spec

**Date**: 2026-03-27
**Status**: Reviewed

## Overview

Add Stripe billing with guest checkout (pay-first, no login required) and magic link authentication to MailCraft. Users can subscribe without an account — payment auto-creates their user, organization, and account. Returning users authenticate via Google OAuth (existing) or magic link (new).

## Goals

- Allow unauthenticated users to pay and become members in one flow
- Eliminate password requirement — auth via magic link or Google OAuth
- Auto-create Stripe products/prices on the fly (no manual Stripe Dashboard setup)
- Provide self-service subscription management via Stripe billing portal
- Handle race conditions between webhook and callback gracefully

## Non-Goals

- Dynamic/custom pricing configurator (fixed plans only)
- Team/seat-based billing
- Annual billing
- Password-based auth changes (existing password login remains for users who have passwords)

---

## 1. Database Changes

### 1.1 Plan model — new fields

```python
stripe_price_id = CharField(max_length=120, blank=True, null=True)
stripe_product_id = CharField(max_length=120, blank=True, null=True)
```

Cached after first auto-creation in Stripe. Cleared if Stripe reports `resource_missing`.

### 1.2 New model: MagicLink

```python
class MagicLink(models.Model):
    email = models.EmailField(db_index=True)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()  # 15 minutes from creation
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'magic_links'
        indexes = [
            models.Index(fields=['expires_at']),
        ]
```

Token hashed with SHA-256 (same pattern as ApiKey/Session). Raw token never stored.

---

## 2. Stripe Price Resolution

### 2.1 Helper: `resolve_stripe_price_id(plan)`

1. If `plan.stripe_price_id` is set, verify with `stripe.Price.retrieve()`:
   - Valid: return it
   - `resource_missing`: clear `stripe_price_id` and `stripe_product_id`, continue
2. If `plan.monthly_price_usd <= 0`: return `None` (free plan, no Stripe checkout)
3. Create Stripe product: `stripe.Product.create(name=f"MailCraft {plan.name} Plan", metadata={slug, plan_id})`
4. Create Stripe price: `stripe.Price.create(product=..., unit_amount=cents, currency="usd", recurring={interval: "month"}, metadata={slug, plan_id})`
5. Save `stripe_price_id` and `stripe_product_id` to Plan (race-safe: use `Plan.objects.filter(id=plan.id, stripe_price_id__isnull=True).update(...)`)
6. If update affected 0 rows (concurrent request won the race): re-read the Plan to get the winning `stripe_price_id` and return it. The locally-created Stripe product/price becomes orphaned — acceptable for this low-frequency operation.
7. Return the price ID

---

## 3. Guest Checkout Flow

### 3.1 Endpoint: `POST /api/v1/billing/guest-checkout`

- **Auth**: None (AllowAny)
- **Rate limit**: 5 requests per IP per minute
- **Request**: `{ "plan": "starter" }`
- **Flow**:
  1. Look up Plan by slug, reject if not found or free
  2. Call `resolve_stripe_price_id(plan)` — reject if returns None
  3. Create Stripe checkout session:
     - `mode="subscription"`
     - `line_items=[{price: stripe_price_id, quantity: 1}]`
     - `success_url="{base}/api/v1/auth/subscribe-callback?session_id={CHECKOUT_SESSION_ID}"`
     - `cancel_url="{base}/pricing?canceled=true"`
     - `metadata={plan: slug, guest: "true"}`
     - No `customer` param (Stripe collects email)
  4. Return `{ "checkout_url": session.url }`

### 3.2 Endpoint: `GET /api/v1/auth/subscribe-callback?session_id=...`

- **Auth**: None (AllowAny)
- **Flow**:
  1. Retrieve Stripe checkout session by `session_id`
  2. Verify `payment_status` is `"paid"` or `"no_payment_required"` — redirect to `/pricing?error=unpaid` if not
  3. Extract: `customer_email` (from `customer_details.email`), `stripe_customer_id`, `stripe_subscription_id`, `metadata.plan`
  4. Look up Plan by slug from metadata
  5. Find or create User:
     - First try `metadata.user_id` (present for authenticated checkout)
     - Then try by email: `User.objects.filter(email__iexact=customer_email).first()`
     - If not found: create with `User.objects.create_user(username=email_prefix, email=email)` + `set_unusable_password()`. Ensure unique username with counter suffix (same pattern as Google OAuth callback).
     - Handle race condition: `except IntegrityError` → re-fetch by email (webhook may have just created the user)
  6. If user has no organizations: create Organization with synthetic email (`f'org-{uuid.uuid4().hex[:20]}@org.mailcraft.dev'`), create UserOrganization (owner). Skip if user already has orgs.
  7. Get or create Account via `get_or_create_account(user)`, then call `_set_account_plan(account, plan_obj, stripe_subscription_id=..., stripe_customer_id=...)`
  8. Clear `stripe_subscription_id` on any other Account for this user that has a different subscription (local DB only — do NOT cancel via Stripe API, as Stripe handles subscription replacement automatically when the same customer subscribes to a new plan)
  9. Create DRF Token via `Token.objects.get_or_create(user=user)` — this makes the callback idempotent: re-hitting the same `session_id` returns the same token for the same user
  10. Redirect to `/dashboard?token=<token_key>`

### 3.3 Updated authenticated checkout: `POST /api/v1/site/billing/subscribe`

- Update `subscribe_account_to_plan()` to use `resolve_stripe_price_id()` instead of inline `price_data`
- Set `success_url` to subscribe-callback (same as guest)
- Include `metadata.user_id` so callback knows it's authenticated

**Note**: The other subscribe endpoint at `POST /api/v1/billing/subscribe` (API-key-authenticated, used by embedded widget integrations) remains unchanged. It also calls `subscribe_account_to_plan()`, so it will automatically benefit from the `resolve_stripe_price_id()` update.

### 3.4 Updated webhook: `POST /api/v1/billing/stripe/webhook`

The existing webhook checks `metadata.user_id` and skips processing if absent. This must change to support guest checkouts where `user_id` is not set.

Handle these events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | See detailed flow below |
| `customer.subscription.updated` | See detailed flow below |
| `customer.subscription.deleted` | Set Account plan to free, clear `stripe_subscription_id` (existing behavior, unchanged) |

**`checkout.session.completed` flow:**
1. Extract `metadata.user_id`, `metadata.plan`, `metadata.guest`
2. Look up Plan by slug
3. Find user: if `user_id` is present, look up by ID. Otherwise, extract `customer_details.email` from the session (use `stripe.checkout.Session.retrieve(session_id)` if email not in event data) and look up by email.
4. If no user found and it's a guest checkout: create user + org + account (same logic as subscribe-callback step 5-6, with IntegrityError handling for race condition with callback)
5. If user found: `get_or_create_account(user)`, then `_set_account_plan(account, plan_obj, stripe_subscription_id=..., stripe_customer_id=...)`

**`customer.subscription.updated` flow:**
1. Extract `stripe_subscription_id` from `data.object.id`
2. Look up Account by `stripe_subscription_id`
3. If not found: ignore (may be a subscription from another system)
4. Extract `price.id` from `data.object.items.data[0].price.id`
5. Reverse-lookup Plan by `stripe_price_id` — if no match, ignore (price created outside app)
6. If plan changed: call `_set_account_plan(account, new_plan_obj)`
7. If subscription status changed to `canceled` or `unpaid`: set Account plan to free

---

## 4. Magic Link Auth

### 4.1 Endpoint: `POST /api/v1/auth/magic-link`

- **Auth**: None (AllowAny)
- **Rate limit**: 5 requests per IP per minute
- **Request**: `{ "email": "user@example.com" }`
- **Flow**:
  1. Normalize email (lowercase, strip)
  2. Look up User by email
  3. If not found: return `{ "status": "ok" }` (no email enumeration)
  4. Invalidate all prior unused MagicLink records for this email: `MagicLink.objects.filter(email=email, used_at__isnull=True).update(used_at=timezone.now())`
  5. Generate raw token (`secrets.token_urlsafe(32)`), hash with SHA-256
  6. Create MagicLink record (expires in 15 minutes)
  7. Send email via Resend with link: `{base}/api/v1/auth/magic-link/verify?token={raw_token}`
  8. Return `{ "status": "ok" }`

### 4.2 Endpoint: `GET /api/v1/auth/magic-link/verify?token=...`

- **Auth**: None (AllowAny)
- **Flow**:
  1. Hash token, look up MagicLink
  2. Validate: exists, not expired, `used_at` is null
  3. Mark as used (`used_at = now()`)
  4. Find User by email
  5. Create DRF Token
  6. Redirect to `/dashboard?token=<token_key>`

### 4.3 Email template

Simple plain-text + HTML email:
- Subject: "Sign in to MailCraft"
- Body: "Click the link below to sign in. This link expires in 15 minutes."
- Link button/text

---

## 5. Billing Portal

### 5.1 Endpoint: `POST /api/v1/site/billing/portal`

- **Auth**: Token required (IsAuthenticated)
- **Flow**:
  1. Get user's Account
  2. Require `stripe_customer_id` — return error if missing
  3. Create Stripe billing portal session: `stripe.billing_portal.Session.create(customer=..., return_url="{base}/dashboard/billing")`
  4. Return `{ "portal_url": session.url }`

---

## 6. Frontend Changes

### 6.1 PricingPage

- **Unauthenticated**: paid plan click → `POST /api/v1/billing/guest-checkout` → redirect to Stripe
- **Authenticated**: paid plan click → `POST /api/v1/site/billing/subscribe` → redirect to Stripe
- **Free plan**: unauthenticated → redirect to `/register`, authenticated → existing switch-to-free flow
- Remove "Log in to choose" disabled state on buttons
- Button text: "Get started" for unauthenticated, "Switch" / "Current plan" for authenticated

### 6.2 LoginPage

Add a "Sign in with email link" section:
- Email input field
- "Send magic link" button
- Success state: "Check your email for a sign-in link"
- Positioned below existing login form, separated by an "or" divider

### 6.3 App.tsx / Token handling

- On `/dashboard` mount: check for `?token=` URL param
- If present: store token in auth context, clear URL param (use `window.history.replaceState` to remove token from URL)
- This handles redirects from: subscribe-callback, magic link verify, Google OAuth
- **Important**: Update the Google OAuth callback in `views.py` to redirect to `/dashboard?token=` instead of `/login?token=`. Keep the `/login?token=` handling in the frontend as well for backward compatibility, but all new flows redirect to `/dashboard?token=`.

### 6.4 DashboardBillingPage

- Show current plan name, subscription status, usage stats
- "Manage subscription" button → calls `POST /api/v1/site/billing/portal` → opens Stripe portal URL
- Show "Manage subscription" only when `stripe_subscription_id` exists
- Remove the plan-switching card grid (Stripe portal handles upgrades/downgrades/cancellation)

### 6.5 API client (`api.ts`)

New methods:
```typescript
guestCheckout: (plan: string) =>
  request<{ checkout_url: string }>('/billing/guest-checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  })

sendMagicLink: (email: string) =>
  request<{ status: string }>('/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

billingPortal: (token: string) =>
  request<{ portal_url: string }>('/site/billing/portal', {
    method: 'POST',
  }, token)
```

---

## 7. URL Routing Summary

### New backend routes (`core/urls.py`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/billing/guest-checkout` | None (rate-limited) | Guest Stripe checkout |
| GET | `/auth/subscribe-callback` | None | Post-checkout redirect handler |
| POST | `/auth/magic-link` | None (rate-limited) | Send magic link email |
| GET | `/auth/magic-link/verify` | None | Verify magic link token |
| POST | `/site/billing/portal` | Token | Stripe billing portal session |

**Path convention note**: The frontend `api.ts` uses `BASE_URL=/api` and in production Caddy rewrites `/api/*` to `/api/v1/*`. So frontend calls like `/billing/guest-checkout` resolve to `/api/v1/billing/guest-checkout` in Django. All paths above are Django-side paths (under `/api/v1/`).

### Updated routes

| Method | Path | Change |
|--------|------|--------|
| POST | `/site/billing/subscribe` | Use `resolve_stripe_price_id`, redirect to subscribe-callback |
| POST | `/billing/stripe/webhook` | Handle additional events, guest user creation |

---

## 8. Rate Limiting

Simple IP-based rate limiting using Django cache:
- `billing/guest-checkout`: 5 requests/min per IP
- `auth/magic-link`: 5 requests/min per IP
- Implementation: decorator that checks `cache.get(f"rl:{endpoint}:{ip}")`, increments counter, returns 429 if exceeded

**Cache backend**: Django defaults to `LocMemCache` which is per-process (not shared across gunicorn workers). This is acceptable for now — the rate limit is a best-effort defense, not a hard security boundary. For production with multiple workers, configure a shared cache backend (Redis or Memcached) via the `CACHES` Django setting. This is out of scope for this implementation.

---

## 9. Security Considerations

- Magic link tokens: 32 bytes of `token_urlsafe`, SHA-256 hashed, 15-min expiry, single-use. Prior unused tokens for the same email are invalidated when a new one is created.
- No email enumeration: magic link endpoint always returns success
- Guest checkout rate-limited by IP to prevent abuse
- Subscribe-callback validates Stripe payment status before creating accounts
- Subscribe-callback is idempotent: `Token.objects.get_or_create(user=user)` returns the same token on repeated calls with the same `session_id`. No replay risk — re-hitting the callback just returns the existing token for the same user.
- Webhook signature verification (already exists)
- Race condition handling: try/except on IntegrityError for concurrent user creation (webhook + callback)

---

## 10. Environment Variables

No new env vars needed. Existing vars used:
- `STRIPE_API_KEY` — Stripe secret key
- `STRIPE_PUBLIC_KEY` — Stripe publishable key (frontend)
- `STRIPE_WEBHOOK_SECRET` — Webhook signature verification
- `STRIPE_SUCCESS_URL` — Replaced by subscribe-callback URL (computed)
- `STRIPE_CANCEL_URL` — Keep for cancel redirect
- `RESEND_API_KEY` — Already configured for transactional email
- `DEFAULT_FROM_EMAIL` — Sender for magic link emails
