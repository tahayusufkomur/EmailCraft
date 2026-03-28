# Stripe Billing & Magic Link Auth — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guest checkout (pay-first, no login), magic link auth, and Stripe billing portal to MailCraft.

**Architecture:** Django backend adds new billing/auth views in `core/views.py` alongside existing code. New `MagicLink` model + `stripe_price_id`/`stripe_product_id` fields on `Plan`. Frontend updates PricingPage for guest checkout, LoginPage for magic link, and DashboardBillingPage for portal. Rate limiting via Django cache decorator.

**Tech Stack:** Django 5.2, DRF, Stripe Python SDK, Resend (email), React 19, TypeScript, Vite, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-27-stripe-billing-magic-link-design.md`

---

## File Structure

### Backend — New/Modified

| File | Action | Responsibility |
|------|--------|---------------|
| `backend/core/models.py` | Modify | Add `stripe_price_id`, `stripe_product_id` to Plan; add `MagicLink` model |
| `backend/core/views.py` | Modify | Add `resolve_stripe_price_id()`, `guest_checkout`, `subscribe_callback`, `magic_link_send`, `magic_link_verify`, `billing_portal`; update `subscribe_account_to_plan()`, `stripe_webhook`, `google_callback` |
| `backend/core/rate_limit.py` | Create | IP-based rate limit decorator |
| `backend/core/urls.py` | Modify | Add new URL patterns |
| `backend/core/site_urls.py` | Modify | Add billing portal URL |
| `backend/core/serializers.py` | Modify | Add `MagicLinkRequestSerializer`, `GuestCheckoutSerializer` |

### Frontend — Modified

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/src/lib/api.ts` | Modify | Add `guestCheckout`, `sendMagicLink`, `billingPortal` methods |
| `frontend/src/types/api.ts` | Modify | Add new response types |
| `frontend/src/pages/PricingPage.tsx` | Modify | Enable guest checkout for unauthenticated users |
| `frontend/src/pages/LoginPage.tsx` | Modify | Add magic link section |
| `frontend/src/pages/DashboardBillingPage.tsx` | Modify | Replace plan grid with portal button |

---

## Chunk 1: Database & Rate Limiting Foundation

### Task 1: Add Stripe fields to Plan model

**Files:**
- Modify: `backend/core/models.py:11-32` (Plan model)

- [ ] **Step 1: Add stripe_price_id and stripe_product_id fields to Plan**

In `backend/core/models.py`, add two fields to the `Plan` model after `sort_order`:

```python
stripe_price_id = models.CharField(max_length=120, blank=True, null=True)
stripe_product_id = models.CharField(max_length=120, blank=True, null=True)
```

- [ ] **Step 2: Create and apply migration**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft
docker compose exec backend python manage.py makemigrations core
docker compose exec backend python manage.py migrate
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Commit**

```bash
git add backend/core/models.py backend/core/migrations/
git commit -m "feat(billing): add stripe_price_id and stripe_product_id to Plan model"
```

---

### Task 2: Add MagicLink model

**Files:**
- Modify: `backend/core/models.py` (add new model at end)

- [ ] **Step 1: Add MagicLink model**

Add at the end of `backend/core/models.py`, before the helper functions:

```python
class MagicLink(models.Model):
    email = models.EmailField(db_index=True)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'magic_links'
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"MagicLink {self.email} (expires {self.expires_at})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_used(self):
        return self.used_at is not None

    @staticmethod
    def hash_token(raw_token):
        return hashlib.sha256(raw_token.encode()).hexdigest()
```

- [ ] **Step 2: Create and apply migration**

```bash
docker compose exec backend python manage.py makemigrations core
docker compose exec backend python manage.py migrate
```

Expected: Migration created and applied.

- [ ] **Step 3: Commit**

```bash
git add backend/core/models.py backend/core/migrations/
git commit -m "feat(auth): add MagicLink model for passwordless authentication"
```

---

### Task 3: Create rate limit decorator

**Files:**
- Create: `backend/core/rate_limit.py`

- [ ] **Step 1: Create rate_limit.py**

Create `backend/core/rate_limit.py`:

```python
from functools import wraps

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response


def rate_limit_by_ip(endpoint_name, max_requests=5, window_seconds=60):
    """Decorator that rate-limits a DRF view by client IP.

    Uses Django's default cache backend. Best-effort — not shared across
    gunicorn workers unless a shared cache (Redis/Memcached) is configured.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = _get_client_ip(request)
            cache_key = f'rl:{endpoint_name}:{ip}'
            current = cache.get(cache_key, 0)
            if current >= max_requests:
                return Response(
                    {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests. Please try again later.'}},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cache.set(cache_key, current + 1, timeout=window_seconds)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')
```

- [ ] **Step 2: Verify import works**

```bash
docker compose exec backend python -c "from core.rate_limit import rate_limit_by_ip; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/core/rate_limit.py
git commit -m "feat(core): add IP-based rate limit decorator"
```

---

### Task 4: Add new serializers

**Files:**
- Modify: `backend/core/serializers.py`

- [ ] **Step 1: Add GuestCheckoutSerializer and MagicLinkRequestSerializer**

Add at the end of `backend/core/serializers.py`:

```python
class GuestCheckoutSerializer(serializers.Serializer):
    plan = serializers.CharField(max_length=50)


class MagicLinkRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/serializers.py
git commit -m "feat(core): add serializers for guest checkout and magic link"
```

---

## Chunk 2: Stripe Price Resolution & Guest Checkout

### Task 5: Implement resolve_stripe_price_id helper

**Files:**
- Modify: `backend/core/views.py` (add helper function)

- [ ] **Step 1: Add resolve_stripe_price_id function**

Add after the `_set_account_plan` function in `backend/core/views.py` (after line 53):

```python
def resolve_stripe_price_id(plan_obj):
    """Resolve or auto-create a Stripe Price for the given Plan.

    Returns the stripe_price_id string, or None if the plan is free.
    Caches the result on the Plan model for subsequent calls.
    """
    from core.models import Plan

    if not settings.STRIPE_API_KEY:
        return None

    stripe.api_key = settings.STRIPE_API_KEY

    # If cached, verify it still exists in Stripe
    if plan_obj.stripe_price_id:
        try:
            stripe.Price.retrieve(plan_obj.stripe_price_id)
            return plan_obj.stripe_price_id
        except stripe.error.InvalidRequestError as exc:
            if 'resource_missing' in str(exc).lower() or 'No such price' in str(exc):
                Plan.objects.filter(id=plan_obj.id).update(
                    stripe_price_id=None,
                    stripe_product_id=None,
                )
                plan_obj.stripe_price_id = None
                plan_obj.stripe_product_id = None
            else:
                raise

    # Free plans don't need Stripe prices
    if plan_obj.monthly_price_usd <= 0:
        return None

    # Create product + price in Stripe
    product = stripe.Product.create(
        name=f'MailCraft {plan_obj.name} Plan',
        metadata={'slug': plan_obj.slug, 'plan_id': str(plan_obj.id)},
    )

    price = stripe.Price.create(
        product=product.id,
        unit_amount=int(plan_obj.monthly_price_usd * 100),
        currency='usd',
        recurring={'interval': 'month'},
        metadata={'slug': plan_obj.slug, 'plan_id': str(plan_obj.id)},
    )

    # Race-safe save: only update if no other request set it first
    updated = Plan.objects.filter(
        id=plan_obj.id,
        stripe_price_id__isnull=True,
    ).update(
        stripe_price_id=price.id,
        stripe_product_id=product.id,
    )

    if updated == 0:
        # Another request won the race — use their price
        plan_obj.refresh_from_db()
        return plan_obj.stripe_price_id

    return price.id
```

- [ ] **Step 2: Verify import works**

```bash
docker compose exec backend python -c "from core.views import resolve_stripe_price_id; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/core/views.py
git commit -m "feat(billing): add resolve_stripe_price_id helper for auto-creating Stripe prices"
```

---

### Task 6: Update subscribe_account_to_plan to use resolve_stripe_price_id

**Files:**
- Modify: `backend/core/views.py:56-120` (subscribe_account_to_plan function)

- [ ] **Step 1: Replace inline price_data with resolve_stripe_price_id**

Replace the `subscribe_account_to_plan` function in `backend/core/views.py`. The function currently creates Stripe checkout sessions with inline `price_data`. Change it to use `resolve_stripe_price_id` and redirect to subscribe-callback:

```python
def subscribe_account_to_plan(account, plan_key):
    from core.models import Plan
    plan_obj = Plan.objects.filter(slug=plan_key).first()
    if not plan_obj:
        return (
            {'error': {'code': 'INVALID_PLAN', 'message': f'Plan "{plan_key}" not found.'}},
            status.HTTP_400_BAD_REQUEST,
        )

    if plan_obj.monthly_price_usd == 0:
        _set_account_plan(account, plan_obj, stripe_subscription_id=None)
        return {'status': 'updated', 'plan': plan_obj.slug}, status.HTTP_200_OK

    stripe_price_id = resolve_stripe_price_id(plan_obj)
    if not stripe_price_id:
        return (
            {'error': {'code': 'STRIPE_NOT_CONFIGURED', 'message': 'Stripe is not configured.'}},
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        customer_id = account.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=account.user.email,
                name=account.user.username,
                metadata={'user_id': str(account.user.id)},
            )
            customer_id = customer.id
            account.stripe_customer_id = customer_id
            account.save(update_fields=['stripe_customer_id', 'updated_at'])

        base_url = _get_base_url()
        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            customer=customer_id,
            success_url=f'{base_url}/api/v1/auth/subscribe-callback?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={
                'user_id': str(account.user.id),
                'plan': plan_obj.slug,
            },
            line_items=[{'price': stripe_price_id, 'quantity': 1}],
        )
    except stripe.error.StripeError as exc:
        return (
            {'error': {'code': 'STRIPE_CHECKOUT_ERROR', 'message': str(exc)}},
            status.HTTP_502_BAD_GATEWAY,
        )

    return (
        {
            'checkout_url': checkout_session.url,
            'session_id': checkout_session.id,
            'plan': plan_obj.slug,
        },
        status.HTTP_200_OK,
    )
```

- [ ] **Step 2: Add _get_base_url helper**

Add this helper near the top of `backend/core/views.py` (after the imports):

```python
def _get_base_url():
    """Return the base URL for the app (used for Stripe redirects)."""
    if settings.DEBUG:
        return 'http://localhost'
    # In production, derive from CSRF_TRUSTED_ORIGINS or STRIPE_SUCCESS_URL
    origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    if origins:
        return origins[0].rstrip('/')
    return 'https://mailcraft.contentor.app'
```

- [ ] **Step 3: Verify backend starts**

```bash
docker compose exec backend python -c "from core.views import subscribe_account_to_plan; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/core/views.py
git commit -m "feat(billing): update subscribe_account_to_plan to use resolve_stripe_price_id"
```

---

### Task 7: Implement guest checkout endpoint

**Files:**
- Modify: `backend/core/views.py` (add guest_checkout view)
- Modify: `backend/core/urls.py` (add URL pattern)

- [ ] **Step 1: Add guest_checkout view**

Add to `backend/core/views.py`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_by_ip('guest-checkout', max_requests=5, window_seconds=60)
def guest_checkout(request):
    """POST /api/v1/billing/guest-checkout — no auth, rate-limited by IP."""
    from core.models import Plan
    from core.serializers import GuestCheckoutSerializer

    serializer = GuestCheckoutSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    plan_key = serializer.validated_data['plan']

    plan_obj = Plan.objects.filter(slug=plan_key).first()
    if not plan_obj:
        return Response(
            {'error': {'code': 'INVALID_PLAN', 'message': f'Plan "{plan_key}" not found.'}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if plan_obj.monthly_price_usd <= 0:
        return Response(
            {'error': {'code': 'FREE_PLAN', 'message': 'Free plan does not require checkout. Register instead.'}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    stripe_price_id = resolve_stripe_price_id(plan_obj)
    if not stripe_price_id:
        return Response(
            {'error': {'code': 'STRIPE_NOT_CONFIGURED', 'message': 'Stripe is not configured.'}},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        base_url = _get_base_url()
        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            line_items=[{'price': stripe_price_id, 'quantity': 1}],
            success_url=f'{base_url}/api/v1/auth/subscribe-callback?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{base_url}/pricing?canceled=true',
            metadata={
                'plan': plan_obj.slug,
                'guest': 'true',
            },
        )
    except stripe.error.StripeError as exc:
        return Response(
            {'error': {'code': 'STRIPE_CHECKOUT_ERROR', 'message': str(exc)}},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'checkout_url': checkout_session.url,
    })
```

- [ ] **Step 2: Add import for rate_limit_by_ip at the top of views.py**

Add to the imports in `backend/core/views.py`:

```python
from core.rate_limit import rate_limit_by_ip
```

- [ ] **Step 3: Add URL pattern**

In `backend/core/urls.py`, add the import and URL:

Add `guest_checkout` to the imports from `core.views`, then add this URL pattern:

```python
path('billing/guest-checkout', guest_checkout, name='billing-guest-checkout'),
```

- [ ] **Step 4: Verify endpoint is reachable**

```bash
docker compose exec backend python -c "
from django.test import RequestFactory
from core.views import guest_checkout
print('guest_checkout view loaded OK')
"
```

Expected: `guest_checkout view loaded OK`

- [ ] **Step 5: Commit**

```bash
git add backend/core/views.py backend/core/urls.py
git commit -m "feat(billing): add guest checkout endpoint"
```

---

## Chunk 3: Subscribe Callback & Webhook Updates

### Task 8: Implement subscribe_callback endpoint

**Files:**
- Modify: `backend/core/views.py` (add subscribe_callback view)
- Modify: `backend/core/urls.py` (add URL pattern)

- [ ] **Step 1: Add find_or_create_user_from_email helper**

Add to `backend/core/views.py`:

```python
def _find_or_create_user_from_email(email):
    """Find existing user by email, or create one with unusable password.

    Returns (user, created) tuple. Handles race conditions from concurrent
    webhook + callback creating the same user.
    """
    user = User.objects.filter(email__iexact=email).first()
    if user:
        return user, False

    # Generate unique username from email prefix
    username = email.split('@')[0]
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f'{base_username}{counter}'
        counter += 1

    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, email=email)
            user.set_unusable_password()
            user.save()
            return user, True
    except IntegrityError:
        # Race condition: webhook may have just created this user
        user = User.objects.filter(email__iexact=email).first()
        if user:
            return user, False
        raise


def _ensure_user_has_org(user, email):
    """Ensure a user has at least one organization. Creates one if needed."""
    from core.models import Organization, UserOrganization
    if UserOrganization.objects.filter(user=user).exists():
        return

    org_email = f'org-{uuid.uuid4().hex[:20]}@org.mailcraft.dev'
    org = Organization.objects.create(
        name=f"{user.username}'s Organization",
        email=org_email,
    )
    UserOrganization.objects.create(user=user, organization=org, role='owner')
```

- [ ] **Step 2: Add subscribe_callback view**

Add to `backend/core/views.py`:

```python
@api_view(['GET'])
@permission_classes([AllowAny])
def subscribe_callback(request):
    """GET /api/v1/auth/subscribe-callback?session_id=...

    Handles redirect from Stripe checkout. Creates user/org/account for
    guest checkout, updates plan, and redirects to dashboard with auth token.
    """
    from core.models import Plan, get_or_create_account

    session_id = request.query_params.get('session_id')
    base_url = _get_base_url()

    if not session_id:
        return HttpResponseRedirect(f'{base_url}/pricing?error=missing_session')

    if not settings.STRIPE_API_KEY:
        return HttpResponseRedirect(f'{base_url}/pricing?error=stripe_not_configured')

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        stripe_session = stripe.checkout.Session.retrieve(session_id)
    except Exception:
        return HttpResponseRedirect(f'{base_url}/pricing?error=invalid_session')

    if stripe_session.payment_status not in ('paid', 'no_payment_required'):
        return HttpResponseRedirect(f'{base_url}/pricing?error=unpaid')

    # Extract data from Stripe session
    metadata = stripe_session.metadata or {}
    plan_key = metadata.get('plan')
    user_id = metadata.get('user_id')
    customer_email = (
        getattr(stripe_session, 'customer_details', None)
        and stripe_session.customer_details.email
    ) or stripe_session.customer_email
    stripe_customer_id = (
        stripe_session.customer
        if isinstance(stripe_session.customer, str)
        else getattr(stripe_session.customer, 'id', None)
    )
    stripe_subscription_id = (
        stripe_session.subscription
        if isinstance(stripe_session.subscription, str)
        else getattr(stripe_session.subscription, 'id', None)
    )

    # Resolve plan
    plan_obj = Plan.objects.filter(slug=plan_key).first() if plan_key else None
    if not plan_obj:
        return HttpResponseRedirect(f'{base_url}/pricing?error=invalid_plan')

    # Find or create user
    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()
    if not user and customer_email:
        user, _ = _find_or_create_user_from_email(customer_email)
    if not user:
        return HttpResponseRedirect(f'{base_url}/pricing?error=no_user')

    # Ensure user has an organization
    _ensure_user_has_org(user, customer_email or user.email)

    # Get or create account, update plan
    account = get_or_create_account(user)
    _set_account_plan(
        account,
        plan_obj,
        stripe_subscription_id=stripe_subscription_id,
        stripe_customer_id=stripe_customer_id or account.stripe_customer_id,
    )

    # Create auth token
    token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{base_url}/dashboard?token={token.key}')
```

- [ ] **Step 3: Add URL pattern**

In `backend/core/urls.py`, add `subscribe_callback` to the imports and add:

```python
path('auth/subscribe-callback', subscribe_callback, name='auth-subscribe-callback'),
```

- [ ] **Step 4: Commit**

```bash
git add backend/core/views.py backend/core/urls.py
git commit -m "feat(billing): add subscribe callback endpoint for post-checkout user creation"
```

---

### Task 9: Update webhook to handle guest checkouts and subscription updates

**Files:**
- Modify: `backend/core/views.py:278-325` (stripe_webhook function)

- [ ] **Step 1: Replace the stripe_webhook function**

Replace the existing `stripe_webhook` function in `backend/core/views.py`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    if not settings.STRIPE_API_KEY:
        return Response({'detail': 'stripe not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    stripe.api_key = settings.STRIPE_API_KEY
    payload = request.body
    signature = request.META.get('HTTP_STRIPE_SIGNATURE', '')

    try:
        event = stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
    except Exception:
        return Response({'detail': 'invalid webhook signature'}, status=status.HTTP_400_BAD_REQUEST)

    event_type = event.get('type')
    data = event.get('data', {}).get('object', {})

    if event_type == 'checkout.session.completed':
        _handle_checkout_completed(data)
    elif event_type == 'customer.subscription.updated':
        _handle_subscription_updated(data)
    elif event_type == 'customer.subscription.deleted':
        _handle_subscription_deleted(data)

    return Response({'received': True})


def _handle_checkout_completed(data):
    """Handle checkout.session.completed — works for both guest and authenticated checkouts."""
    from core.models import Account, Plan, get_or_create_account

    metadata = data.get('metadata', {})
    user_id = metadata.get('user_id')
    plan_key = metadata.get('plan')

    plan_obj = Plan.objects.filter(slug=plan_key).first() if plan_key else None
    if not plan_obj:
        return

    # Find user by ID (authenticated) or email (guest)
    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()

    if not user:
        customer_email = (data.get('customer_details') or {}).get('email')
        if not customer_email:
            # Try to retrieve full session from Stripe for email
            try:
                session = stripe.checkout.Session.retrieve(data.get('id', ''))
                customer_email = (
                    getattr(session, 'customer_details', None)
                    and session.customer_details.email
                )
            except Exception:
                return
        if customer_email:
            user, _ = _find_or_create_user_from_email(customer_email)

    if not user:
        return

    _ensure_user_has_org(user, user.email)

    account = get_or_create_account(user)
    _set_account_plan(
        account,
        plan_obj,
        stripe_subscription_id=data.get('subscription'),
        stripe_customer_id=data.get('customer') or account.stripe_customer_id,
    )


def _handle_subscription_updated(data):
    """Handle customer.subscription.updated — plan changes and status updates."""
    from core.models import Account, Plan

    stripe_sub_id = data.get('id')
    if not stripe_sub_id:
        return

    try:
        account = Account.objects.get(stripe_subscription_id=stripe_sub_id)
    except Account.DoesNotExist:
        return

    # Check for plan change via price ID
    items = data.get('items', {}).get('data', [])
    if items:
        price_id = items[0].get('price', {}).get('id')
        if price_id:
            new_plan = Plan.objects.filter(stripe_price_id=price_id).first()
            if new_plan and new_plan.id != account.plan_id:
                _set_account_plan(account, new_plan)

    # Check for cancellation status
    sub_status = data.get('status', '')
    if sub_status in ('canceled', 'unpaid'):
        free_plan = Plan.objects.filter(slug='free').first()
        if free_plan:
            _set_account_plan(account, free_plan, stripe_subscription_id=None)


def _handle_subscription_deleted(data):
    """Handle customer.subscription.deleted — revert to free plan."""
    from core.models import Account, Plan

    customer_id = data.get('customer')
    if not customer_id:
        return

    try:
        account = Account.objects.get(stripe_customer_id=customer_id)
    except Account.DoesNotExist:
        return

    free_plan = Plan.objects.filter(slug='free').first()
    if free_plan:
        _set_account_plan(account, free_plan, stripe_subscription_id=None)
```

- [ ] **Step 2: Verify webhook handler loads**

```bash
docker compose exec backend python -c "from core.views import stripe_webhook; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/core/views.py
git commit -m "feat(billing): update webhook to handle guest checkouts and subscription updates"
```

---

### Task 10: Update Google OAuth redirect

**Files:**
- Modify: `backend/core/views.py:451` (google_callback redirect)

- [ ] **Step 1: Change redirect from /login?token= to /dashboard?token=**

In `backend/core/views.py`, find the `google_callback` function and change the final redirect:

Replace:
```python
    return HttpResponseRedirect(f'{frontend_url}/login?token={token.key}')
```

With:
```python
    return HttpResponseRedirect(f'{frontend_url}/dashboard?token={token.key}')
```

- [ ] **Step 2: Commit**

```bash
git add backend/core/views.py
git commit -m "feat(auth): redirect Google OAuth callback to /dashboard?token= for consistency"
```

---

## Chunk 4: Magic Link Auth

### Task 11: Implement magic link send endpoint

**Files:**
- Modify: `backend/core/views.py` (add magic_link_send view)
- Modify: `backend/core/urls.py` (add URL pattern)

- [ ] **Step 1: Add magic_link_send view**

Add to `backend/core/views.py`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
@rate_limit_by_ip('magic-link', max_requests=5, window_seconds=60)
def magic_link_send(request):
    """POST /api/v1/auth/magic-link — send a magic link email."""
    from core.models import MagicLink
    from core.serializers import MagicLinkRequestSerializer

    serializer = MagicLinkRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email'].lower().strip()

    # Always return success to prevent email enumeration
    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return Response({'status': 'ok'})

    # Invalidate prior unused tokens for this email
    MagicLink.objects.filter(
        email=email,
        used_at__isnull=True,
    ).update(used_at=timezone.now())

    # Generate new token
    raw_token = secrets.token_urlsafe(32)
    token_hash = MagicLink.hash_token(raw_token)
    expires_at = timezone.now() + timedelta(minutes=15)

    MagicLink.objects.create(
        email=email,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    # Send email
    base_url = _get_base_url()
    verify_url = f'{base_url}/api/v1/auth/magic-link/verify?token={raw_token}'

    from django.core.mail import send_mail
    send_mail(
        subject='Sign in to MailCraft',
        message=f'Click the link below to sign in to MailCraft. This link expires in 15 minutes.\n\n{verify_url}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
        html_message=(
            f'<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">'
            f'<h2 style="margin-bottom: 16px;">Sign in to MailCraft</h2>'
            f'<p style="margin-bottom: 24px; color: #555;">Click the button below to sign in. This link expires in 15 minutes.</p>'
            f'<a href="{verify_url}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; '
            f'text-decoration: none; border-radius: 6px; font-weight: 500;">Sign in to MailCraft</a>'
            f'<p style="margin-top: 24px; font-size: 12px; color: #999;">If you didn\'t request this link, you can safely ignore this email.</p>'
            f'</div>'
        ),
    )

    return Response({'status': 'ok'})
```

- [ ] **Step 2: Add URL pattern**

In `backend/core/urls.py`, add `magic_link_send` to imports and add:

```python
path('auth/magic-link', magic_link_send, name='auth-magic-link'),
```

- [ ] **Step 3: Commit**

```bash
git add backend/core/views.py backend/core/urls.py
git commit -m "feat(auth): add magic link send endpoint"
```

---

### Task 12: Implement magic link verify endpoint

**Files:**
- Modify: `backend/core/views.py` (add magic_link_verify view)
- Modify: `backend/core/urls.py` (add URL pattern)

- [ ] **Step 1: Add magic_link_verify view**

Add to `backend/core/views.py`:

```python
@api_view(['GET'])
@permission_classes([AllowAny])
def magic_link_verify(request):
    """GET /api/v1/auth/magic-link/verify?token=... — verify magic link and log in."""
    from core.models import MagicLink

    raw_token = request.query_params.get('token')
    base_url = _get_base_url()

    if not raw_token:
        return HttpResponseRedirect(f'{base_url}/login?error=missing_token')

    token_hash = MagicLink.hash_token(raw_token)

    try:
        link = MagicLink.objects.get(token_hash=token_hash)
    except MagicLink.DoesNotExist:
        return HttpResponseRedirect(f'{base_url}/login?error=invalid_link')

    if link.is_used:
        return HttpResponseRedirect(f'{base_url}/login?error=link_already_used')

    if link.is_expired:
        return HttpResponseRedirect(f'{base_url}/login?error=link_expired')

    # Mark as used
    link.used_at = timezone.now()
    link.save(update_fields=['used_at'])

    # Find user by email
    user = User.objects.filter(email__iexact=link.email).first()
    if not user:
        return HttpResponseRedirect(f'{base_url}/login?error=user_not_found')

    # Create auth token
    auth_token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{base_url}/dashboard?token={auth_token.key}')
```

- [ ] **Step 2: Add URL pattern**

In `backend/core/urls.py`, add `magic_link_verify` to imports and add:

```python
path('auth/magic-link/verify', magic_link_verify, name='auth-magic-link-verify'),
```

- [ ] **Step 3: Commit**

```bash
git add backend/core/views.py backend/core/urls.py
git commit -m "feat(auth): add magic link verify endpoint"
```

---

## Chunk 5: Billing Portal & Backend Wrapup

### Task 13: Implement billing portal endpoint

**Files:**
- Modify: `backend/core/site_views.py` (add site_billing_portal view)
- Modify: `backend/core/site_urls.py` (add URL pattern)

- [ ] **Step 1: Add site_billing_portal view**

Add to `backend/core/site_views.py`:

```python
@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_billing_portal(request):
    """POST /api/v1/site/billing/portal — create Stripe billing portal session."""
    import stripe
    from django.conf import settings

    account = account_for_user(request.user)
    if not account:
        return Response(
            {'error': {'code': 'NO_ACCOUNT', 'message': 'No billing account found.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not account.stripe_customer_id:
        return Response(
            {'error': {'code': 'NO_STRIPE_CUSTOMER', 'message': 'No Stripe customer linked. Subscribe to a plan first.'}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.STRIPE_API_KEY:
        return Response(
            {'error': {'code': 'STRIPE_NOT_CONFIGURED', 'message': 'Stripe is not configured.'}},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        # Derive return URL
        origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
        base_url = origins[0].rstrip('/') if origins else 'http://localhost'
        if settings.DEBUG:
            base_url = 'http://localhost'

        portal_session = stripe.billing_portal.Session.create(
            customer=account.stripe_customer_id,
            return_url=f'{base_url}/dashboard/billing',
        )
    except stripe.error.StripeError as exc:
        return Response(
            {'error': {'code': 'STRIPE_PORTAL_ERROR', 'message': str(exc)}},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({'portal_url': portal_session.url})
```

- [ ] **Step 2: Add URL pattern**

In `backend/core/site_urls.py`, add `site_billing_portal` to the imports and add:

```python
path('billing/portal', site_billing_portal, name='site-billing-portal'),
```

- [ ] **Step 3: Commit**

```bash
git add backend/core/site_views.py backend/core/site_urls.py
git commit -m "feat(billing): add Stripe billing portal endpoint"
```

---

### Task 14: Final backend URL wiring verification

**Files:**
- Read: `backend/core/urls.py` (verify all new routes)
- Read: `backend/core/site_urls.py` (verify portal route)

- [ ] **Step 1: Verify all URL patterns load**

```bash
docker compose exec backend python -c "
from django.urls import reverse
print(reverse('billing-guest-checkout'))
print(reverse('auth-subscribe-callback'))
print(reverse('auth-magic-link'))
print(reverse('auth-magic-link-verify'))
print(reverse('site-billing-portal'))
print('All URLs resolved OK')
"
```

Expected: All 5 URLs printed, ending with `All URLs resolved OK`.

- [ ] **Step 2: Run backend tests and check for import errors**

```bash
docker compose exec backend python manage.py check
```

Expected: `System check identified no issues.`

- [ ] **Step 3: Commit (if any fixes were needed)**

Only commit if fixes were made in prior steps.

---

## Chunk 6: Frontend — API Client & Types

### Task 15: Add new API types

**Files:**
- Modify: `frontend/src/types/api.ts`

- [ ] **Step 1: Add GuestCheckoutResponse and MagicLinkResponse types**

Add at the end of `frontend/src/types/api.ts`:

```typescript
export interface GuestCheckoutResponse {
  checkout_url: string;
}

export interface MagicLinkResponse {
  status: string;
}

export interface BillingPortalResponse {
  portal_url: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/api.ts
git commit -m "feat(frontend): add types for guest checkout, magic link, and billing portal"
```

---

### Task 16: Add new API client methods

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Add guestCheckout, sendMagicLink, billingPortal methods**

Add the following methods to the `api` object in `frontend/src/lib/api.ts`, after the existing `subscribe` method:

```typescript
  guestCheckout: (plan: string) =>
    request<GuestCheckoutResponse>('/billing/guest-checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }),

  sendMagicLink: (email: string) =>
    request<MagicLinkResponse>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  billingPortal: (token: string) =>
    request<BillingPortalResponse>('/site/billing/portal', {
      method: 'POST',
    }, token),
```

- [ ] **Step 2: Add imports for new types**

Update the import at the top of `frontend/src/lib/api.ts` to include the new types:

```typescript
import type {
  // ... existing imports ...
  GuestCheckoutResponse,
  MagicLinkResponse,
  BillingPortalResponse,
} from '../types/api';
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add API client methods for guest checkout, magic link, and billing portal"
```

---

## Chunk 7: Frontend — Page Updates

### Task 17: Update PricingPage for guest checkout

**Files:**
- Modify: `frontend/src/pages/PricingPage.tsx`

- [ ] **Step 1: Replace PricingPage with guest checkout support**

Replace the entire content of `frontend/src/pages/PricingPage.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, sortPlans } from '../lib/plans';
import type { PricingPlan } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function PricingPage() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .fetchPricing()
      .then((res) => setPlans(sortPlans(res.plans)))
      .catch((err: Error) => setError(err.message));
  }, []);

  const cards = useMemo(() => sortPlans(plans), [plans]);

  const handleChoosePlan = async (plan: PricingPlan) => {
    setError(null);
    setBusyPlan(plan.plan);

    try {
      if (plan.monthly_price_usd === 0) {
        if (!isAuthenticated) {
          navigate('/register');
          return;
        }
        const result = await api.subscribe(token!, plan.plan);
        if (result.status === 'updated') {
          navigate('/dashboard/billing');
        }
        return;
      }

      if (isAuthenticated) {
        // Authenticated checkout
        const result = await api.subscribe(token!, plan.plan);
        if (result.checkout_url) {
          window.location.href = result.checkout_url;
          return;
        }
        if (result.status === 'updated') {
          navigate('/dashboard/billing');
          return;
        }
        setError('Unexpected response from subscription.');
      } else {
        // Guest checkout
        const result = await api.guestCheckout(plan.plan);
        window.location.href = result.checkout_url;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const getButtonText = (plan: PricingPlan) => {
    if (busyPlan === plan.plan) return 'Processing...';
    if (plan.monthly_price_usd === 0) {
      return isAuthenticated ? 'Switch to free' : 'Get started free';
    }
    return isAuthenticated ? 'Switch plan' : 'Get started';
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Clear monthly limits by organization. Upgrade instantly from the dashboard.
      </p>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((plan) => (
          <Card key={plan.plan} className={plan.plan === 'pro' ? 'border-primary/50' : ''}>
            <CardHeader>
              <CardTitle>{PLAN_LABELS[plan.plan]}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-semibold text-foreground">${plan.monthly_price_usd}</span> / month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{plan.rendered_emails_limit.toLocaleString()} rendered emails / month</p>
              <p>{formatBytes(plan.storage_limit_bytes)} media storage</p>
              <p>{formatBytes(plan.max_upload_size_bytes)} max upload size</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.plan === 'free' ? 'outline' : 'default'}
                disabled={busyPlan === plan.plan}
                onClick={() => { void handleChoosePlan(plan); }}
              >
                {getButtonText(plan)}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PricingPage.tsx
git commit -m "feat(frontend): enable guest checkout on pricing page"
```

---

### Task 18: Update LoginPage with magic link section

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Add magic link section to LoginPage**

Replace the entire content of `frontend/src/pages/LoginPage.tsx`:

```tsx
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Magic link state
  const [magicEmail, setMagicEmail] = useState('');
  const [magicBusy, setMagicBusy] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show error from URL params (e.g., magic link errors)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlError = params.get('error');
    if (urlError) {
      const errorMessages: Record<string, string> = {
        invalid_link: 'This sign-in link is invalid.',
        link_expired: 'This sign-in link has expired. Please request a new one.',
        link_already_used: 'This sign-in link has already been used.',
        user_not_found: 'No account found for this email.',
        missing_token: 'Invalid sign-in link.',
      };
      setError(errorMessages[urlError] || urlError);
    }
  }, [location.search]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(identifier, password);
      const redirect = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMagicBusy(true);
    setMagicError(null);
    setMagicSent(false);
    try {
      await api.sendMagicLink(magicEmail);
      setMagicSent(true);
    } catch (err) {
      setMagicError((err as Error).message);
    } finally {
      setMagicBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Use your email/username and password to access dashboard features.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? 'Signing in...' : 'Sign in'}
            </Button>
            <Button asChild className="w-full" type="button" variant="outline">
              <a href="/api/auth/google/login/">Continue with Google</a>
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            No account yet?{' '}
            <Link className="text-foreground underline" to="/register">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sign in with email link</CardTitle>
          <CardDescription>We'll send you a link to sign in without a password.</CardDescription>
        </CardHeader>
        <CardContent>
          {magicSent ? (
            <p className="text-sm text-muted-foreground">
              Check your email for a sign-in link. It expires in 15 minutes.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={onMagicLink}>
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              {magicError && <p className="text-sm text-destructive">{magicError}</p>}
              <Button className="w-full" variant="outline" disabled={magicBusy} type="submit">
                {magicBusy ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat(frontend): add magic link sign-in section to login page"
```

---

### Task 19: Update DashboardBillingPage with portal button

**Files:**
- Modify: `frontend/src/pages/DashboardBillingPage.tsx`

- [ ] **Step 1: Replace DashboardBillingPage with portal-based UI**

Replace the entire content of `frontend/src/pages/DashboardBillingPage.tsx`:

```tsx
import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS } from '../lib/plans';
import type { SiteDashboardResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function DashboardBillingPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void api
      .getDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  const handleManageSubscription = async () => {
    if (!token) return;
    setPortalBusy(true);
    setError(null);
    try {
      const result = await api.billingPortal(token);
      window.location.href = result.portal_url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Current plan: <span className="font-medium text-foreground">{dashboard ? PLAN_LABELS[dashboard.plan] : '-'}</span>
        </p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {dashboard && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rendered Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {dashboard.rendered_emails_count.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {dashboard.rendered_emails_limit.toLocaleString()}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatBytes(dashboard.storage_used_bytes)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {formatBytes(dashboard.storage_limit_bytes)}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{dashboard.organizations_count}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            {dashboard.stripe_subscription_id ? (
              <Button
                onClick={() => { void handleManageSubscription(); }}
                disabled={portalBusy}
              >
                {portalBusy ? 'Opening...' : 'Manage subscription'}
              </Button>
            ) : (
              <Button asChild>
                <a href="/pricing">View plans</a>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardBillingPage.tsx
git commit -m "feat(frontend): replace billing page plan grid with portal button and usage stats"
```

---

## Chunk 8: Token Handling & Build Verification

### Task 20: Ensure token extraction works on /dashboard route

**Files:**
- Read: `frontend/src/lib/auth.tsx` (verify existing extractOAuthToken)

- [ ] **Step 1: Verify token extraction already works globally**

The existing `AuthProvider` in `frontend/src/lib/auth.tsx` (lines 27-40) already calls `extractOAuthToken()` on initialization, which reads `?token=` from the current URL, stores it in localStorage, and cleans the URL. Since `AuthProvider` wraps the entire app, this works on ANY route — including `/dashboard?token=...`.

No changes needed. The Google OAuth redirect change (Task 10) and subscribe-callback redirect both use `/dashboard?token=`, which is already handled.

Verify by reading the file and confirming `extractOAuthToken()` runs in the `useState` initializer (line 43-51), which executes on any page load.

- [ ] **Step 2: Commit (no changes expected)**

No commit needed — this is a verification step.

---

### Task 21: Build verification

- [ ] **Step 1: Run backend check**

```bash
docker compose exec backend python manage.py check
```

Expected: `System check identified no issues.`

- [ ] **Step 2: Run frontend type-check**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run frontend build**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft/frontend && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Start dev server and verify pages load**

```bash
cd /Users/tahayusufkomur/ws/workdir-contentor-customerapp/mailCraft && make dev
```

Verify manually:
- `/pricing` — all plans should have "Get started" buttons (not "Log in to choose")
- `/login` — should show magic link section below password form
- `/dashboard/billing` (when logged in) — should show usage stats and "Manage subscription" or "View plans"

---

## Summary

**18 tasks** across **8 chunks**:

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Database changes (Plan fields, MagicLink model), rate limiter, serializers |
| 2 | 5-7 | Stripe price resolution, updated subscribe flow, guest checkout endpoint |
| 3 | 8-10 | Subscribe callback, webhook updates, Google OAuth redirect fix |
| 4 | 11-12 | Magic link send and verify endpoints |
| 5 | 13-14 | Billing portal endpoint, backend URL verification |
| 6 | 15-16 | Frontend API types and client methods |
| 7 | 17-19 | PricingPage, LoginPage, DashboardBillingPage updates |
| 8 | 20-21 | Token handling verification, full build check |
