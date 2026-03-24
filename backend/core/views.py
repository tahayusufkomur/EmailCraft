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
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from core.models import ApiKey, Organization, Session, UserOrganization, billing_organization_for_org
from core.serializers import SessionRequestSerializer, SubscribeRequestSerializer


def _plan_payload(plan_key):
    plan = settings.PLAN_LIMITS.get(plan_key, settings.PLAN_LIMITS['free'])
    return {
        'plan': plan_key,
        'monthly_price_usd': plan['monthly_price_usd'],
        'rendered_emails_limit': plan['rendered_emails_limit'],
        'storage_limit_bytes': plan['storage_limit_bytes'],
        'max_upload_size_bytes': plan['max_upload_size_bytes'],
        'max_media_files_per_upload': plan.get('max_media_files_per_upload', 1),
    }


def _set_org_plan(org, plan_key, stripe_subscription_id=None, stripe_customer_id=None):
    org.plan = plan_key
    org.apply_plan_limits(save=False)
    if stripe_customer_id is not None:
        org.stripe_customer_id = stripe_customer_id
    if stripe_subscription_id is not None:
        org.stripe_subscription_id = stripe_subscription_id
    org.save(
        update_fields=[
            'plan',
            'rendered_emails_limit',
            'storage_limit_bytes',
            'stripe_customer_id',
            'stripe_subscription_id',
            'updated_at',
        ]
    )


def subscribe_org_to_plan(org, plan_key):
    plan = settings.PLAN_LIMITS[plan_key]

    if plan['monthly_price_usd'] == 0:
        _set_org_plan(org, 'free', stripe_subscription_id=None)
        return {'status': 'updated', 'plan': 'free'}, status.HTTP_200_OK

    if not settings.STRIPE_API_KEY:
        return (
            {'error': {'code': 'STRIPE_NOT_CONFIGURED', 'message': 'Stripe API key is missing.'}},
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    stripe.api_key = settings.STRIPE_API_KEY

    try:
        customer_id = org.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=org.email,
                name=org.name,
                metadata={'org_id': str(org.id)},
            )
            customer_id = customer.id
            org.stripe_customer_id = customer_id
            org.save(update_fields=['stripe_customer_id', 'updated_at'])

        checkout_session = stripe.checkout.Session.create(
            mode='subscription',
            customer=customer_id,
            success_url=settings.STRIPE_SUCCESS_URL,
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={'org_id': str(org.id), 'plan': plan_key},
            line_items=[
                {
                    'quantity': 1,
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': int(plan['monthly_price_usd'] * 100),
                        'recurring': {'interval': 'month'},
                        'product_data': {'name': f'MailCraft {plan_key.title()} Plan'},
                    },
                }
            ],
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
            'plan': plan_key,
        },
        status.HTTP_200_OK,
    )


def _build_session_config_response(org, session_token, expires_at):
    billing_org = billing_organization_for_org(org)
    return Response({
        'token': session_token,
        'expires_at': expires_at.isoformat(),
        'config': {
            'plan': billing_org.plan,
            'variables': org.available_variables or [],
            'max_upload_size_bytes': billing_org.max_upload_size_bytes,
            'max_media_files_per_upload': billing_org.max_media_files_per_upload,
            'storage_used_bytes': billing_org.storage_used_bytes,
            'storage_limit_bytes': billing_org.storage_limit_bytes,
            'rendered_emails_count': billing_org.rendered_emails_count,
            'rendered_emails_limit': billing_org.rendered_emails_limit,
            'widget_context': {
                'show_logo': org.show_logo,
                'show_export_html_button': org.show_export_html_button,
                'theme_mode': org.theme_mode,
                'builder_theme': org.builder_theme,
                'email_background_style': org.email_background_style,
                'email_background_color': org.email_background_color,
            },
        },
    })


@api_view(['POST'])
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
    plans = [_plan_payload(plan_key) for plan_key in settings.PLAN_LIMITS.keys()]
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
    payload, status_code = subscribe_org_to_plan(org, serializer.validated_data['plan'])
    return Response(payload, status=status_code)


@api_view(['POST'])
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
        metadata = data.get('metadata', {})
        org_id = metadata.get('org_id')
        plan_key = metadata.get('plan')
        if org_id and plan_key in settings.PLAN_LIMITS:
            try:
                org = Organization.objects.get(pk=org_id)
                _set_org_plan(
                    org,
                    plan_key,
                    stripe_subscription_id=data.get('subscription'),
                    stripe_customer_id=data.get('customer') or org.stripe_customer_id,
                )
            except Organization.DoesNotExist:
                pass

    if event_type == 'customer.subscription.deleted':
        customer_id = data.get('customer')
        if customer_id:
            try:
                org = Organization.objects.get(stripe_customer_id=customer_id)
                _set_org_plan(org, 'free', stripe_subscription_id=None)
            except Organization.DoesNotExist:
                pass

    return Response({'received': True})


class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client


GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'


def _get_google_redirect_uri(request):
    scheme = 'https' if request.is_secure() or request.META.get('HTTP_X_FORWARDED_PROTO') == 'https' else 'http'
    host = request.get_host()
    return f'{scheme}://{host}/api/v1/auth/google/callback/'


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
    user = User.objects.filter(email__iexact=email).first()

    if not user:
        # New user — create with unusable password
        username = email.split('@')[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base_username}{counter}'
            counter += 1

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=name.split(' ')[0] if name else '',
                last_name=' '.join(name.split(' ')[1:]) if name and ' ' in name else '',
            )
            user.set_unusable_password()
            user.save()

            # Auto-create organization
            org_name = name or email.split('@')[0]
            org = Organization.objects.create(
                name=f"{org_name}'s Organization",
                email=email,
                plan='free',
            )
            org.apply_plan_limits(save=True)
            UserOrganization.objects.create(user=user, organization=org, role='owner')

    # Generate DRF token
    token, _ = Token.objects.get_or_create(user=user)

    return HttpResponseRedirect(f'{frontend_url}/login?token={token.key}')
