from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.models import Organization, UserOrganization
from core.serializers import OrganizationSerializer, SiteRegisterSerializer, SubscribeRequestSerializer
from core.views import subscribe_org_to_plan
from templates_api.models import Template
from templates_api.serializers import TemplateCreateSerializer, TemplateDetailSerializer, TemplateListSerializer


def _organization_for_user(user: User):
    membership = UserOrganization.objects.select_related('organization').filter(user=user).first()
    return membership.organization if membership else None


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
            'user': {'id': user.id, 'username': user.username, 'email': user.email},
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
            'user': {'id': request.user.id, 'username': request.user.username, 'email': request.user.email},
            'organization': OrganizationSerializer(org).data,
        }
    )


@api_view(['GET'])
@authentication_classes([TokenAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def site_dashboard(request):
    org = _organization_for_user(request.user)
    if not org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {
            'plan': org.plan,
            'rendered_emails_count': org.rendered_emails_count,
            'rendered_emails_limit': org.rendered_emails_limit,
            'storage_used_bytes': org.storage_used_bytes,
            'storage_limit_bytes': org.storage_limit_bytes,
            'stripe_subscription_id': org.stripe_subscription_id,
        }
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
    org = _organization_for_user(request.user)
    if not org:
        return Response(
            {'error': {'code': 'ORG_NOT_FOUND', 'message': 'No organization linked to this user.'}},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = SubscribeRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    payload, status_code = subscribe_org_to_plan(org, serializer.validated_data['plan'])
    return Response(payload, status=status_code)
