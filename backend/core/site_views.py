import uuid

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.models import (
    Organization,
    UserOrganization,
    billing_organization_for_user,
    ensure_reusable_test_api_key,
    organizations_for_user,
    primary_organization_for_user,
)
from core.serializers import (
    ApiKeySummarySerializer,
    OrganizationSerializer,
    OrganizationWithApiKeysSerializer,
    SiteApiKeyCreateSerializer,
    SiteLoginSerializer,
    SiteOrganizationCreateSerializer,
    SiteOrganizationUpdateSerializer,
    SiteRegisterSerializer,
    SubscribeRequestSerializer,
)
from core.views import subscribe_org_to_plan
from templates_api.models import Template
from templates_api.serializers import TemplateCreateSerializer, TemplateDetailSerializer, TemplateListSerializer


def _organization_for_user(user: User):
    return primary_organization_for_user(user)


def _organization_membership_for_user(user: User, organization_id):
    return UserOrganization.objects.select_related('organization').filter(user=user, organization_id=organization_id).first()


def _resolve_login_username(identifier: str):
    normalized = identifier.strip()
    if not normalized:
        return None
    if '@' in normalized:
        user = User.objects.filter(email__iexact=normalized).first()
        return user.username if user else None
    return normalized


@api_view(['POST'])
@permission_classes([AllowAny])
def site_login(request):
    serializer = SiteLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    username = _resolve_login_username(data['identifier'])
    if not username:
        return Response(
            {'error': {'code': 'INVALID_CREDENTIALS', 'message': 'Invalid username/email or password.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=username, password=data['password'])
    if not user:
        return Response(
            {'error': {'code': 'INVALID_CREDENTIALS', 'message': 'Invalid username/email or password.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([AllowAny])
def site_register(request):
    serializer = SiteRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
            )
            org = Organization.objects.create(
                name=data['organization_name'],
                email=data['email'],
                plan='free',
            )
            org.apply_plan_limits(save=True)
            UserOrganization.objects.create(user=user, organization=org, role='owner')
            token, _ = Token.objects.get_or_create(user=user)
    except IntegrityError:
        return Response(
            {'error': {'code': 'REGISTRATION_FAILED', 'message': 'Username or email already exists.'}},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        {
            'token': token.key,
            'user': {'username': user.username, 'email': user.email},
            'organization': OrganizationSerializer(org).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_me(request):
    org = _organization_for_user(request.user)
    if not org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            'user': {'username': request.user.username, 'email': request.user.email},
            'organization': OrganizationSerializer(org).data,
        }
    )


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_dashboard(request):
    billing_org = billing_organization_for_user(request.user)
    if not billing_org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            'plan': billing_org.plan,
            'rendered_emails_count': billing_org.rendered_emails_count,
            'rendered_emails_limit': billing_org.rendered_emails_limit,
            'max_media_files_per_upload': billing_org.max_media_files_per_upload,
            'storage_used_bytes': billing_org.storage_used_bytes,
            'storage_limit_bytes': billing_org.storage_limit_bytes,
            'organizations_count': organizations_for_user(request.user).count(),
            'stripe_subscription_id': billing_org.stripe_subscription_id,
        }
    )


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_organizations(request):
    if request.method == 'GET':
        orgs = (
            organizations_for_user(request.user)
            .prefetch_related('api_keys')
            .order_by('-created_at')
        )
        serializer = OrganizationWithApiKeysSerializer(orgs, many=True)
        return Response({'results': serializer.data})

    serializer = SiteOrganizationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    billing_org = billing_organization_for_user(request.user)
    plan = billing_org.plan if billing_org else 'free'

    try:
        with transaction.atomic():
            generated_org_email = f'org-{uuid.uuid4().hex[:20]}@org.mailcraft.dev'
            org = Organization.objects.create(
                name=data['name'],
                email=generated_org_email,
                plan=plan,
                allowed_origins=data.get('allowed_origins', []),
                available_variables=data.get('available_variables', []),
                show_logo=data.get('show_logo', True),
                show_export_html_button=data.get('show_export_html_button', True),
                theme_mode=data.get('theme_mode', 'system'),
            )
            org.apply_plan_limits(save=True)
            UserOrganization.objects.create(user=request.user, organization=org, role='owner')

            raw_key, created_key = ensure_reusable_test_api_key(org, refresh=False)
    except IntegrityError:
        return Response(
            {'error': {'code': 'ORGANIZATION_CREATE_FAILED', 'message': 'Failed to create organization.'}},
            status=status.HTTP_409_CONFLICT,
        )
    except ValueError as exc:
        return Response(
            {'error': {'code': 'API_KEY_CREATE_FAILED', 'message': str(exc)}},
            status=status.HTTP_409_CONFLICT,
        )

    payload = {
        'organization': OrganizationWithApiKeysSerializer(org).data,
    }
    if raw_key and created_key:
        payload['created_api_key'] = {
            'raw': raw_key,
            'item': ApiKeySummarySerializer(created_key).data,
        }

    return Response(payload, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_organization_detail(request, organization_id):
    membership = _organization_membership_for_user(request.user, organization_id)
    if not membership:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'Organization not found for this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )
    if membership.role != 'owner':
        return Response(
            {'error': {'code': 'FORBIDDEN', 'message': 'Only organization owners can edit organization settings.'}},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SiteOrganizationUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    org = membership.organization
    changed_fields = []
    for field in [
        'name',
        'allowed_origins',
        'available_variables',
        'show_logo',
        'show_export_html_button',
        'theme_mode',
    ]:
        if field in data:
            setattr(org, field, data[field])
            changed_fields.append(field)

    if changed_fields:
        org.save(update_fields=[*changed_fields, 'updated_at'])

    return Response(OrganizationWithApiKeysSerializer(org).data)


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_organization_api_keys(request, organization_id):
    membership = _organization_membership_for_user(request.user, organization_id)
    if not membership:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'Organization not found for this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )
    if membership.role != 'owner':
        return Response(
            {'error': {'code': 'FORBIDDEN', 'message': 'Only organization owners can create API keys.'}},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = SiteApiKeyCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    refresh = serializer.validated_data['refresh']

    try:
        raw_key, api_key = ensure_reusable_test_api_key(
            membership.organization,
            refresh=refresh,
        )
    except ValueError as exc:
        return Response(
            {'error': {'code': 'API_KEY_CREATE_FAILED', 'message': str(exc)}},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        {
            'raw': raw_key,
            'item': ApiKeySummarySerializer(api_key).data,
            'refreshed': refresh,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_templates(request):
    org = _organization_for_user(request.user)
    if not org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        queryset = Template.objects.for_org(org)
        serializer = TemplateListSerializer(queryset, many=True)
        return Response({'results': serializer.data})

    serializer = TemplateCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    template = serializer.save(org=org)
    return Response(TemplateDetailSerializer(template).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_template_detail(request, template_id):
    org = _organization_for_user(request.user)
    if not org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    template = Template.objects.for_org(org).filter(id=template_id).first()
    if not template:
        return Response(
            {'error': {'code': 'TEMPLATE_NOT_FOUND', 'message': 'Template not found.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        return Response(TemplateDetailSerializer(template).data)

    if request.method == 'DELETE':
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = TemplateCreateSerializer(template, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save(org=org)
    return Response(TemplateDetailSerializer(template).data)


@api_view(['POST'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_subscribe(request):
    billing_org = billing_organization_for_user(request.user)
    if not billing_org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = SubscribeRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload, status_code = subscribe_org_to_plan(billing_org, serializer.validated_data['plan'])
    return Response(payload, status=status_code)
