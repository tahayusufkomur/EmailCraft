import secrets
import uuid
from datetime import timedelta
from urllib.parse import urlencode

import requests as http_requests
import stripe
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import ApiKey, Organization, Session, UserOrganization, account_for_org
from core.rate_limit import rate_limit_by_ip
from core.serializers import EmailSetupSerializer, SessionRequestSerializer, SubscribeRequestSerializer


def _get_base_url():
    """Return the base URL for the app (used for Stripe redirects)."""
    if settings.DEBUG:
        return 'http://localhost'
    origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    if origins:
        return origins[0].rstrip('/')
    return 'https://mailcraft.contentor.app'


def _plan_payload(plan_obj):
    return {
        'plan': plan_obj.slug,
        'monthly_price_usd': float(plan_obj.monthly_price_usd),
        'rendered_emails_limit': plan_obj.rendered_emails_limit,
        'storage_limit_bytes': plan_obj.storage_limit_bytes,
        'max_upload_size_bytes': plan_obj.max_upload_size_bytes,
        'max_media_files_per_upload': plan_obj.max_media_files_per_upload,
        'max_organizations': plan_obj.max_organizations,
        'max_api_keys_per_org': plan_obj.max_api_keys_per_org,
    }


_UNSET = object()


def _set_account_plan(account, plan_obj, stripe_subscription_id=_UNSET, stripe_customer_id=_UNSET):
    account.plan = plan_obj
    account.apply_plan_limits(save=False)
    if stripe_customer_id is not _UNSET:
        account.stripe_customer_id = stripe_customer_id
    if stripe_subscription_id is not _UNSET:
        account.stripe_subscription_id = stripe_subscription_id
    account.usage_warning_sent = False
    account.usage_limit_sent = False
    account.save(
        update_fields=[
            'plan',
            'pending_plan',
            'rendered_emails_limit',
            'storage_limit_mb',
            'stripe_customer_id',
            'stripe_subscription_id',
            'usage_warning_sent',
            'usage_limit_sent',
            'updated_at',
        ]
    )
    from core.models import UserOrganization, ApiKey
    from templates_api.services import provision_templates_for_org

    memberships = list(
        UserOrganization.objects.filter(user=account.user, role='owner')
        .select_related('organization')
        .order_by('created_at')
    )

    # Enforce org limit: deactivate orgs beyond the plan's max
    max_orgs = plan_obj.max_organizations if plan_obj else 1
    for membership in memberships:
        provision_templates_for_org(membership.organization)
    if len(memberships) > max_orgs:
        keep = {m.organization_id for m in memberships[:max_orgs]}
        for membership in memberships[max_orgs:]:
            membership.organization.is_active = False
            membership.organization.save(update_fields=['is_active', 'updated_at'])

    # Enforce API key limit per org: revoke keys beyond the plan's max
    max_keys = plan_obj.max_api_keys_per_org if plan_obj else 1
    from django.utils import timezone as _tz
    for membership in memberships[:max_orgs]:
        active_keys = list(
            ApiKey.objects.filter(org=membership.organization, is_active=True, revoked_at__isnull=True)
            .order_by('created_at')
        )
        if len(active_keys) > max_keys:
            for key in active_keys[max_keys:]:
                key.is_active = False
                key.revoked_at = _tz.now()
                key.save(update_fields=['is_active', 'revoked_at'])


def resolve_stripe_price_id(plan_obj):
    """Resolve or auto-create a Stripe Price for the given Plan."""
    from core.models import Plan

    if not settings.STRIPE_API_KEY:
        return None

    stripe.api_key = settings.STRIPE_API_KEY

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

    if plan_obj.monthly_price_usd <= 0:
        return None

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

    updated = Plan.objects.filter(
        id=plan_obj.id,
        stripe_price_id__isnull=True,
    ).update(
        stripe_price_id=price.id,
        stripe_product_id=product.id,
    )

    if updated == 0:
        plan_obj.refresh_from_db()
        return plan_obj.stripe_price_id

    return price.id


def _find_or_create_user_from_email(email):
    """Find existing user by email, or create one with unusable password."""
    user = User.objects.filter(email__iexact=email).first()
    if user:
        return user, False

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
    from templates_api.services import provision_templates_for_org
    provision_templates_for_org(org)


def _ensure_stripe_customer(account):
    """Ensure the account has a Stripe customer ID, creating one if needed."""
    if account.stripe_customer_id:
        return account.stripe_customer_id
    customer = stripe.Customer.create(
        email=account.user.email,
        name=account.user.username,
        metadata={'user_id': str(account.user.id)},
    )
    account.stripe_customer_id = customer.id
    account.save(update_fields=['stripe_customer_id', 'updated_at'])
    return customer.id


def _create_checkout_session(account, plan_obj, stripe_price_id):
    """Create a Stripe Checkout Session for first-time subscription."""
    customer_id = _ensure_stripe_customer(account)
    base_url = _get_base_url()
    checkout_session = stripe.checkout.Session.create(
        mode='subscription',
        customer=customer_id,
        success_url=f'{base_url}/api/auth/subscribe-callback?session_id={{CHECKOUT_SESSION_ID}}',
        cancel_url=settings.STRIPE_CANCEL_URL,
        metadata={
            'user_id': str(account.user.id),
            'plan': plan_obj.slug,
        },
        line_items=[{'price': stripe_price_id, 'quantity': 1}],
    )
    return {
        'checkout_url': checkout_session.url,
        'session_id': checkout_session.id,
        'plan': plan_obj.slug,
    }, status.HTTP_200_OK


def _handle_upgrade(account, plan_obj, stripe_price_id):
    """Upgrade: Stripe Checkout with prorated credit for remaining current plan time."""
    import time as _time

    sub = stripe.Subscription.retrieve(account.stripe_subscription_id)
    period_start = sub['current_period_start']
    period_end = sub['current_period_end']
    now = int(_time.time())
    total_period = period_end - period_start
    remaining = max(0, period_end - now)

    # Credit for unused time on current plan
    credit_cents = 0
    if total_period > 0 and remaining > 0:
        current_amount = sub['items']['data'][0]['price']['unit_amount']
        credit_cents = int((remaining / total_period) * current_amount)

    base_url = _get_base_url()
    session_params = {
        'mode': 'subscription',
        'customer': account.stripe_customer_id,
        'success_url': f'{base_url}/api/auth/subscribe-callback?session_id={{CHECKOUT_SESSION_ID}}',
        'cancel_url': f'{base_url}/dashboard/billing',
        'metadata': {
            'user_id': str(account.user.id),
            'plan': plan_obj.slug,
            'previous_subscription_id': account.stripe_subscription_id,
        },
        'line_items': [{'price': stripe_price_id, 'quantity': 1}],
    }

    if credit_cents > 0:
        coupon = stripe.Coupon.create(
            amount_off=credit_cents,
            currency='usd',
            duration='once',
            name=f'Unused {account.plan.name} credit',
        )
        session_params['discounts'] = [{'coupon': coupon.id}]

    checkout_session = stripe.checkout.Session.create(**session_params)
    return {
        'checkout_url': checkout_session.url,
        'session_id': checkout_session.id,
        'plan': plan_obj.slug,
    }, status.HTTP_200_OK


def _handle_downgrade(account, plan_obj):
    """Downgrade: cancel current subscription at period end, store pending plan."""
    sub = stripe.Subscription.modify(
        account.stripe_subscription_id,
        cancel_at_period_end=True,
    )
    account.pending_plan = plan_obj
    account.save(update_fields=['pending_plan', 'updated_at'])
    from core.emails import send_downgrade_scheduled_email
    current_plan_name = account.plan.name if account.plan else 'Free'
    send_downgrade_scheduled_email(account.user, current_plan_name, plan_obj.name)
    return {
        'status': 'downgrade_scheduled',
        'plan': account.plan_slug,
        'pending_plan': plan_obj.slug,
        'current_period_end': sub['current_period_end'],
    }, status.HTTP_200_OK


def subscribe_account_to_plan(account, plan_key):
    from core.models import Plan
    plan_obj = Plan.objects.filter(slug=plan_key).first()
    if not plan_obj:
        return (
            {'error': {'code': 'INVALID_PLAN', 'message': f'Plan "{plan_key}" not found.'}},
            status.HTTP_400_BAD_REQUEST,
        )

    # Same plan — no-op (unless there's a pending downgrade to cancel)
    if account.plan_id == plan_obj.id and not account.pending_plan:
        return {'status': 'unchanged', 'plan': plan_obj.slug}, status.HTTP_200_OK

    # Cancel a pending downgrade (stay on current plan)
    if account.plan_id == plan_obj.id and account.pending_plan:
        stripe.api_key = settings.STRIPE_API_KEY
        try:
            stripe.Subscription.modify(account.stripe_subscription_id, cancel_at_period_end=False)
        except stripe.error.StripeError:
            pass
        account.pending_plan = None
        account.save(update_fields=['pending_plan', 'updated_at'])
        return {'status': 'downgrade_cancelled', 'plan': plan_obj.slug}, status.HTTP_200_OK

    # Switch to free — immediate only if no active subscription
    if plan_obj.monthly_price_usd == 0 and not account.stripe_subscription_id:
        account.pending_plan = None
        _set_account_plan(account, plan_obj, stripe_subscription_id=None)
        return {'status': 'updated', 'plan': plan_obj.slug}, status.HTTP_200_OK

    # Downgrade to free with active subscription — schedule like any other downgrade
    if plan_obj.monthly_price_usd == 0 and account.stripe_subscription_id:
        stripe.api_key = settings.STRIPE_API_KEY
        try:
            return _handle_downgrade(account, plan_obj)
        except stripe.error.StripeError as exc:
            return (
                {'error': {'code': 'STRIPE_ERROR', 'message': str(exc)}},
                status.HTTP_502_BAD_GATEWAY,
            )

    stripe_price_id = resolve_stripe_price_id(plan_obj)
    if not stripe_price_id:
        return (
            {'error': {'code': 'STRIPE_NOT_CONFIGURED', 'message': 'Stripe is not configured.'}},
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        # No existing subscription — first-time checkout
        if not account.stripe_subscription_id:
            return _create_checkout_session(account, plan_obj, stripe_price_id)

        current_price = float(account.plan.monthly_price_usd) if account.plan else 0
        new_price = float(plan_obj.monthly_price_usd)

        if new_price > current_price:
            return _handle_upgrade(account, plan_obj, stripe_price_id)
        else:
            return _handle_downgrade(account, plan_obj)

    except stripe.error.StripeError as exc:
        return (
            {'error': {'code': 'STRIPE_ERROR', 'message': str(exc)}},
            status.HTTP_502_BAD_GATEWAY,
        )


def _build_session_config_response(org, session_token, expires_at):
    account = account_for_org(org)
    return Response({
        'token': session_token,
        'expires_at': expires_at.isoformat(),
        'config': {
            'plan': account.plan_slug if account else 'free',
            'variables': org.available_variables or [],
            'max_upload_size_bytes': account.max_upload_size_bytes if account else 5242880,
            'max_media_files_per_upload': account.max_media_files_per_upload if account else 1,
            'storage_used_bytes': account.storage_used_bytes if account else 0,
            'storage_limit_bytes': account.storage_limit_bytes if account else 1073741824,
            'rendered_emails_count': account.rendered_emails_count if account else 0,
            'rendered_emails_limit': account.rendered_emails_limit if account else 1000,
            'widget_context': {
                'show_logo': org.show_logo,
                'show_export_html_button': org.show_export_html_button,
                'theme_mode': org.theme_mode,
                'builder_theme': org.builder_theme,
                'email_background_style': org.email_background_style,
                'email_background_color': org.email_background_color,
                'default_palette': org.default_palette,
                'custom_palette': org.custom_palette,
            },
        },
    })


@api_view(['POST'])
@authentication_classes([])
def create_session(request):
    """
    POST /api/v1/auth/session
    Authenticates via API key or existing session token.
    With API key: creates a new session token and returns config.
    With session token: refreshes config without creating a new session.
    """
    serializer = SessionRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    origin = serializer.validated_data['origin']

    # Try session token first (for config refresh)
    session_token_raw = request.META.get('HTTP_X_SESSION_TOKEN', '')
    if session_token_raw:
        token_hash = Session.hash_token(session_token_raw)
        try:
            session = Session.objects.select_related('org').get(token_hash=token_hash)
        except Session.DoesNotExist:
            return Response(
                {'error': {'code': 'INVALID_SESSION', 'message': 'Invalid session token.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if session.is_expired:
            return Response(
                {'error': {'code': 'SESSION_EXPIRED', 'message': 'Session expired. Create a new session with your API key.'}},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return _build_session_config_response(session.org, session_token_raw, session.expires_at)

    # Fall back to API key (creates a new session)
    api_key_raw = request.META.get('HTTP_X_API_KEY', '')
    if not api_key_raw:
        return Response(
            {'error': {'code': 'AUTH_REQUIRED', 'message': 'API key or session token is required.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    key_hash = ApiKey.hash_key(api_key_raw)
    try:
        api_key = ApiKey.objects.select_related('org').get(
            key_hash=key_hash,
            is_active=True,
            revoked_at__isnull=True,
        )
    except ApiKey.DoesNotExist:
        return Response(
            {'error': {'code': 'INVALID_API_KEY', 'message': 'Invalid or revoked API key.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    org = api_key.org

    # Origin validation for live keys
    if api_key.environment == 'live' and org.allowed_origins:
        if origin not in org.allowed_origins:
            return Response(
                {'error': {'code': 'UNAUTHORIZED_ORIGIN', 'message': f'Origin {origin} is not allowed.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

    new_token = Session.generate_token()
    token_hash = Session.hash_token(new_token)
    expires_at = timezone.now() + timedelta(hours=4)

    Session.objects.create(
        org=org,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    return _build_session_config_response(org, new_token, expires_at)


@api_view(['GET'])
def landing_page(request):
    return Response({
        'hero': {
            'title': 'MailCraft: Build and ship email templates quickly',
            'subtitle': 'Drag, drop, and export production-safe email HTML with usage-based plans.',
        },
        'features': [
            'Email-safe HTML export',
            'Template management and gallery',
            'S3-backed media uploads by organization',
            'API-key based multi-tenant access',
        ],
        'cta': {
            'pricing_path': '/pricing',
            'subscribe_path': '/subscribe',
        },
    })


@api_view(['GET'])
def pricing_page(request):
    from core.models import Plan
    plans = [_plan_payload(p) for p in Plan.objects.all()]
    return Response({
        'currency': 'USD',
        'billing_cycle': 'monthly',
        'plans': plans,
        'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
    })


@api_view(['GET'])
def subscribe_page(request):
    return Response({
        'title': 'Subscribe to a MailCraft plan',
        'description': 'Pick a plan and start checkout. Your organization limits are updated automatically.',
        'endpoint': '/api/v1/billing/subscribe',
        'required_payload': {'plan': 'starter | pro | enterprise | free'},
    })


@api_view(['POST'])
def subscribe_plan(request):
    serializer = SubscribeRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    account = account_for_org(org)
    if not account:
        return Response({'error': {'code': 'NO_ACCOUNT', 'message': 'No billing account found.'}}, status=status.HTTP_404_NOT_FOUND)
    payload, status_code = subscribe_account_to_plan(account, serializer.validated_data['plan'])
    return Response(payload, status=status_code)


def _handle_payment_failed(data):
    from core.models import Account
    from core.emails import send_payment_failed_email

    customer_id = data.get('customer')
    if not customer_id:
        return

    try:
        account = Account.objects.select_related('plan', 'user').get(stripe_customer_id=customer_id)
    except Account.DoesNotExist:
        return

    send_payment_failed_email(
        account.user,
        account.plan.name if account.plan else 'Unknown',
        data.get('attempt_count', 1),
    )


def _handle_invoice_paid(data):
    """Reset usage email flags at the start of a new billing cycle."""
    from core.models import Account

    customer_id = data.get('customer')
    if not customer_id:
        return

    try:
        account = Account.objects.get(stripe_customer_id=customer_id)
    except Account.DoesNotExist:
        return

    account.usage_warning_sent = False
    account.usage_limit_sent = False
    account.save(update_fields=['usage_warning_sent', 'usage_limit_sent', 'updated_at'])


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
    elif event_type == 'invoice.payment_failed':
        _handle_payment_failed(data)
    elif event_type == 'invoice.paid':
        _handle_invoice_paid(data)

    return Response({'received': True})


def _handle_checkout_completed(data):
    from core.models import Plan, get_or_create_account

    metadata = data.get('metadata', {})
    user_id = metadata.get('user_id')
    plan_key = metadata.get('plan')

    plan_obj = Plan.objects.filter(slug=plan_key).first() if plan_key else None
    if not plan_obj:
        return

    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()

    if not user:
        customer_email = (data.get('customer_details') or {}).get('email')
        if not customer_email:
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

    # Cancel previous subscription if this was an upgrade
    previous_sub = metadata.get('previous_subscription_id')
    if previous_sub:
        try:
            stripe.Subscription.cancel(previous_sub)
        except stripe.error.StripeError:
            pass

    account.pending_plan = None
    _set_account_plan(
        account,
        plan_obj,
        stripe_subscription_id=data.get('subscription'),
        stripe_customer_id=data.get('customer') or account.stripe_customer_id,
    )

    from core.emails import send_plan_upgraded_email
    send_plan_upgraded_email(
        account.user,
        plan_obj.name,
        plan_obj.rendered_emails_limit,
        f'{plan_obj.storage_limit_mb // 1024} GB' if plan_obj.storage_limit_mb >= 1024 else f'{plan_obj.storage_limit_mb} MB',
    )


def _handle_subscription_updated(data):
    from core.models import Account, Plan

    stripe_sub_id = data.get('id')
    if not stripe_sub_id:
        return

    try:
        account = Account.objects.select_related('pending_plan').get(stripe_subscription_id=stripe_sub_id)
    except Account.DoesNotExist:
        return

    # If cancel_at_period_end was reverted (user cancelled a pending downgrade)
    if not data.get('cancel_at_period_end', False) and account.pending_plan:
        account.pending_plan = None
        account.save(update_fields=['pending_plan', 'updated_at'])

    items = data.get('items', {}).get('data', [])
    if items:
        price_id = items[0].get('price', {}).get('id')
        if price_id:
            new_plan = Plan.objects.filter(stripe_price_id=price_id).first()
            if new_plan and new_plan.id != account.plan_id:
                account.pending_plan = None
                _set_account_plan(account, new_plan)

    sub_status = data.get('status', '')
    if sub_status in ('canceled', 'unpaid'):
        account.pending_plan = None
        free_plan = Plan.objects.filter(slug='free').first()
        if free_plan:
            _set_account_plan(account, free_plan, stripe_subscription_id=None)


def _handle_subscription_deleted(data):
    from core.models import Account, Plan

    customer_id = data.get('customer')
    if not customer_id:
        return

    try:
        account = Account.objects.select_related('pending_plan').get(stripe_customer_id=customer_id)
    except Account.DoesNotExist:
        return

    if account.pending_plan:
        pending = account.pending_plan

        # Pending plan is free — just switch directly
        if pending.monthly_price_usd == 0:
            account.pending_plan = None
            _set_account_plan(account, pending, stripe_subscription_id=None)
            from core.emails import send_plan_activated_email
            send_plan_activated_email(account.user, pending.name)
            return

        # Pending plan is paid — create a new subscription
        stripe_price_id = resolve_stripe_price_id(pending)
        if stripe_price_id:
            try:
                new_sub = stripe.Subscription.create(
                    customer=customer_id,
                    items=[{'price': stripe_price_id}],
                    metadata={
                        'user_id': str(account.user_id),
                        'plan': pending.slug,
                    },
                )
                account.pending_plan = None
                _set_account_plan(account, pending, stripe_subscription_id=new_sub.id)
                from core.emails import send_plan_activated_email
                send_plan_activated_email(account.user, pending.name)
                return
            except stripe.error.StripeError:
                pass

    # Fallback: downgrade to free
    account.pending_plan = None
    free_plan = Plan.objects.filter(slug='free').first()
    if free_plan:
        _set_account_plan(account, free_plan, stripe_subscription_id=None)


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client


GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'


def _get_google_redirect_uri(request):
    scheme = 'https' if request.is_secure() or request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' else 'http'
    host = request.get_host()
    # Use /api/ (not /api/v1/) because Caddy rewrites /api/* → /api/v1/*
    return f'{scheme}://{host}/api/auth/google/callback/'


def _get_frontend_url(request):
    scheme = 'https' if request.is_secure() or request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' else 'http'
    host = request.get_host()
    return f'{scheme}://{host}'


@api_view(['GET'])
@permission_classes([AllowAny])
def google_login_redirect(request):
    """Redirect user to Google's OAuth consent screen."""
    provider = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    client_id = provider.get('APP', {}).get('client_id', '')

    params = {
        'client_id': client_id,
        'redirect_uri': _get_google_redirect_uri(request),
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'online',
        'prompt': 'select_account',
    }
    return HttpResponseRedirect(f'{GOOGLE_AUTH_URL}?{urlencode(params)}')


@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    """Handle Google's OAuth callback: exchange code, find/create user + org, redirect with token."""
    code = request.query_params.get('code')
    error = request.query_params.get('error')
    frontend_url = _get_frontend_url(request)

    if error or not code:
        return HttpResponseRedirect(f'{frontend_url}/login?error=google_denied')

    provider = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    client_id = provider.get('APP', {}).get('client_id', '')
    client_secret = provider.get('APP', {}).get('secret', '')

    # Exchange code for tokens
    token_resp = http_requests.post(GOOGLE_TOKEN_URL, data={
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': _get_google_redirect_uri(request),
        'grant_type': 'authorization_code',
    }, timeout=10)

    if token_resp.status_code != 200:
        return HttpResponseRedirect(f'{frontend_url}/login?error=google_token_failed')

    access_token = token_resp.json().get('access_token')
    if not access_token:
        return HttpResponseRedirect(f'{frontend_url}/login?error=google_token_failed')

    # Get user info from Google
    userinfo_resp = http_requests.get(GOOGLE_USERINFO_URL, headers={
        'Authorization': f'Bearer {access_token}',
    }, timeout=10)

    if userinfo_resp.status_code != 200:
        return HttpResponseRedirect(f'{frontend_url}/login?error=google_userinfo_failed')

    google_user = userinfo_resp.json()
    email = google_user.get('email', '').lower().strip()
    name = google_user.get('name', '')

    if not email:
        return HttpResponseRedirect(f'{frontend_url}/login?error=google_no_email')

    # Find or create Django user
    user, created = _find_or_create_user_from_email(email)

    if created:
        # Set name fields from Google profile
        user.first_name = name.split(' ')[0] if name else ''
        user.last_name = ' '.join(name.split(' ')[1:]) if name and ' ' in name else ''
        user.save(update_fields=['first_name', 'last_name'])

    # Ensure user has an organization
    _ensure_user_has_org(user, email)

    if created:
        from core.models import get_or_create_account
        get_or_create_account(user)
        from core.emails import send_welcome_email
        send_welcome_email(user)

    # Generate DRF token
    token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{frontend_url}/dashboard?token={token.key}')


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
            success_url=f'{base_url}/api/auth/subscribe-callback?session_id={{CHECKOUT_SESSION_ID}}',
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


@api_view(['GET'])
@permission_classes([AllowAny])
def subscribe_callback(request):
    """GET /api/auth/subscribe-callback?session_id=..."""
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

    plan_obj = Plan.objects.filter(slug=plan_key).first() if plan_key else None
    if not plan_obj:
        return HttpResponseRedirect(f'{base_url}/pricing?error=invalid_plan')

    user = None
    if user_id:
        user = User.objects.filter(id=user_id).first()
    if not user and customer_email:
        user, _ = _find_or_create_user_from_email(customer_email)
    if not user:
        return HttpResponseRedirect(f'{base_url}/pricing?error=no_user')

    _ensure_user_has_org(user, customer_email or user.email)

    account = get_or_create_account(user)

    # Cancel previous subscription if this was an upgrade
    previous_sub = metadata.get('previous_subscription_id')
    if previous_sub:
        try:
            stripe.Subscription.cancel(previous_sub)
        except stripe.error.StripeError:
            pass

    account.pending_plan = None
    _set_account_plan(
        account,
        plan_obj,
        stripe_subscription_id=stripe_subscription_id,
        stripe_customer_id=stripe_customer_id or account.stripe_customer_id,
    )

    from core.emails import send_plan_upgraded_email
    send_plan_upgraded_email(
        account.user,
        plan_obj.name,
        plan_obj.rendered_emails_limit,
        f'{plan_obj.storage_limit_mb // 1024} GB' if plan_obj.storage_limit_mb >= 1024 else f'{plan_obj.storage_limit_mb} MB',
    )

    token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{base_url}/dashboard/billing?token={token.key}')


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

    # Send magic link to any email — works for both login and signup.
    # New users are created when they verify the link.

    MagicLink.objects.filter(
        email=email,
        used_at__isnull=True,
    ).update(used_at=timezone.now())

    raw_token = secrets.token_urlsafe(32)
    token_hash = MagicLink.hash_token(raw_token)
    expires_at = timezone.now() + timedelta(minutes=15)

    MagicLink.objects.create(
        email=email,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    base_url = _get_base_url()
    verify_url = f'{base_url}/api/auth/magic-link/verify?token={raw_token}'

    from core.emails import send_magic_link_email
    send_magic_link_email(email, verify_url)

    return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([AllowAny])
def magic_link_verify(request):
    """GET /api/auth/magic-link/verify?token=..."""
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

    # Atomic mark-as-used to prevent TOCTOU race with concurrent requests
    updated = MagicLink.objects.filter(
        token_hash=token_hash,
        used_at__isnull=True,
    ).update(used_at=timezone.now())
    if updated == 0:
        return HttpResponseRedirect(f'{base_url}/login?error=link_already_used')

    # Find or create user — magic link doubles as signup for new users
    from core.models import get_or_create_account
    user, created = _find_or_create_user_from_email(link.email)
    if created:
        _ensure_user_has_org(user, link.email)
        get_or_create_account(user)
        from core.emails import send_welcome_email
        send_welcome_email(user)

    auth_token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{base_url}/dashboard?token={auth_token.key}')


@api_view(['PATCH'])
def email_setup(request):
    # Require API key auth with 'full' scope — reject session tokens and readonly keys
    api_key = getattr(request, 'api_key', None)
    if not api_key:
        return Response(
            {'error': {'code': 'API_KEY_REQUIRED', 'message': 'This endpoint requires API key authentication (not session tokens).'}},
            status=status.HTTP_403_FORBIDDEN,
        )
    if api_key.scope != 'full':
        return Response(
            {'error': {'code': 'INSUFFICIENT_SCOPE', 'message': 'This API key has readonly scope.'}},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = EmailSetupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    org = request.org
    org.available_variables = serializer.validated_data['available_variables']
    org.save(update_fields=['available_variables'])

    return Response({'available_variables': org.available_variables})
