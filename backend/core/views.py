import secrets
from datetime import timedelta

import stripe
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import ApiKey, Organization, billing_organization_for_org
from core.serializers import SessionRequestSerializer, SubscribeRequestSerializer


def _plan_payload(plan_key):
    plan = settings.PLAN_LIMITS.get(plan_key, settings.PLAN_LIMITS['free'])
    return {
        'plan': plan_key,
        'monthly_price_usd': plan['monthly_price_usd'],
        'rendered_emails_limit': plan['rendered_emails_limit'],
        'storage_limit_bytes': plan['storage_limit_bytes'],
        'max_upload_size_bytes': plan['max_upload_size_bytes'],
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


@api_view(['POST'])
def create_session(request):
    """
    POST /api/v1/auth/session
    Validates API key + origin, returns a session token and config.
    """
    serializer = SessionRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    api_key_raw = request.META.get('HTTP_X_API_KEY', '')
    origin = serializer.validated_data['origin']

    if not api_key_raw:
        return Response(
            {'error': {'code': 'INVALID_API_KEY', 'message': 'API key is required.'}},
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
    billing_org = billing_organization_for_org(org)

    # Origin validation for live keys
    if api_key.environment == 'live' and org.allowed_origins:
        if origin not in org.allowed_origins:
            return Response(
                {'error': {'code': 'UNAUTHORIZED_ORIGIN', 'message': f'Origin {origin} is not allowed.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

    session_token = f"sess_{secrets.token_hex(32)}"
    expires_at = timezone.now() + timedelta(hours=4)

    return Response({
        'token': session_token,
        'expires_at': expires_at.isoformat(),
        'config': {
            'plan': billing_org.plan,
            'max_upload_size_bytes': billing_org.max_upload_size_bytes,
            'storage_used_bytes': billing_org.storage_used_bytes,
            'storage_limit_bytes': billing_org.storage_limit_bytes,
            'rendered_emails_count': billing_org.rendered_emails_count,
            'rendered_emails_limit': billing_org.rendered_emails_limit,
        },
    })


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
