import uuid

import boto3
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import billing_organization_for_org
from templates_api.models import Template, UploadedImage
from templates_api.serializers import (
    ExportRequestSerializer,
    GalleryTemplateSerializer,
    PresignRequestSerializer,
    RenderRequestSerializer,
    TemplateCreateSerializer,
    TemplateDetailSerializer,
    TemplateListSerializer,
    UploadedImageListSerializer,
)
from templates_api.export_engine import (
    extract_variable_keys,
    render_email_html,
    substitute_variables,
)


class TemplateViewSet(viewsets.ModelViewSet):
    """CRUD for organization templates."""

    def get_serializer_class(self):
        if self.action == 'list':
            return TemplateListSerializer
        if self.action == 'create':
            return TemplateCreateSerializer
        return TemplateDetailSerializer

    def get_queryset(self):
        return Template.objects.for_org(self.request.org)

    def perform_create(self, serializer):
        serializer.save(org=self.request.org)

    def perform_update(self, serializer):
        serializer.save(org=self.request.org)


@api_view(['GET'])
def gallery_list(request):
    """GET /api/v1/gallery — list prebuilt gallery templates."""
    queryset = Template.objects.filter(is_gallery=True)

    category = request.query_params.get('category')
    if category:
        queryset = queryset.filter(category=category)

    serializer = GalleryTemplateSerializer(queryset, many=True)
    return Response({'data': serializer.data})


@api_view(['GET'])
def media_list(request):
    """GET /api/v1/media — list uploaded media for the current organization."""
    queryset = UploadedImage.objects.for_org(request.org).order_by('-created_at')
    serializer = UploadedImageListSerializer(queryset, many=True)
    return Response({'results': serializer.data})


@api_view(['POST'])
def presign_upload(request):
    """POST /api/v1/upload/presign — get an S3 presigned URL for image upload."""
    serializer = PresignRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    billing_org = billing_organization_for_org(org)
    data = serializer.validated_data

    # Check plan-based upload size limit
    max_size = billing_org.max_upload_size_bytes
    if data['file_size'] > max_size:
        return Response(
            {'error': {'code': 'FILE_TOO_LARGE', 'message': f'Max file size is {max_size} bytes.'}},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    # Check storage limit
    if billing_org.storage_used_bytes + data['file_size'] > billing_org.storage_limit_bytes:
        return Response(
            {'error': {'code': 'STORAGE_LIMIT_EXCEEDED', 'message': 'Organization storage limit exceeded.'}},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    # Generate S3 key: emailBuilder/<organization>/<file>
    file_ext = data['filename'].rsplit('.', 1)[-1] if '.' in data['filename'] else 'bin'
    s3_key = f"{settings.AWS_S3_KEY_PREFIX}/{org.id}/{uuid.uuid4().hex}.{file_ext}"
    bucket_name = settings.AWS_S3_PUBLIC_BUCKET
    if not bucket_name:
        return Response(
            {'error': {'code': 'S3_NOT_CONFIGURED', 'message': 'S3 public bucket is not configured.'}},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            region_name=settings.AWS_S3_REGION_NAME,
        )
        upload_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key,
                'ContentType': data['content_type'],
            },
            ExpiresIn=settings.PRESIGNED_URL_EXPIRY,
            HttpMethod='PUT',
        )
    except Exception as exc:
        return Response(
            {'error': {'code': 'S3_PRESIGN_ERROR', 'message': f'Unable to create upload URL: {exc}'}},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if settings.AWS_CLOUDFRONT_DOMAIN:
        file_url = f"{settings.AWS_CLOUDFRONT_DOMAIN.rstrip('/')}/{s3_key}"
    elif settings.AWS_S3_ENDPOINT_URL:
        file_url = f"{settings.AWS_S3_ENDPOINT_URL.rstrip('/')}/{bucket_name}/{s3_key}"
    else:
        file_url = f"https://{bucket_name}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"

    # Record the image
    UploadedImage.objects.create(
        org=org,
        s3_key=s3_key,
        url=file_url,
        file_size=data['file_size'],
        content_type=data['content_type'],
    )

    # Update storage used
    billing_org.storage_used_bytes += data['file_size']
    billing_org.save(update_fields=['storage_used_bytes'])

    return Response({
        'upload_url': upload_url,
        'file_url': file_url,
        'expires_at': None,  # Will be real expiry in production
    })


@api_view(['POST'])
def export_html(request):
    """POST /api/v1/export/html — convert template JSON to email HTML."""
    serializer = ExportRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    billing_org = billing_organization_for_org(org)
    if billing_org.rendered_emails_count >= billing_org.rendered_emails_limit:
        return Response(
            {
                'error': {
                    'code': 'EMAIL_RENDER_LIMIT_EXCEEDED',
                    'message': 'Monthly rendered email limit exceeded for current plan.',
                }
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    json_data = serializer.validated_data['json_data']
    variables_mode = serializer.validated_data['variables_mode']

    result = render_email_html(json_data, variables_mode)

    billing_org.rendered_emails_count += 1
    billing_org.save(update_fields=['rendered_emails_count', 'updated_at'])

    return Response({
        'html': result['html'],
        'warnings': result.get('warnings', []),
    })


@api_view(['POST'])
def render_template(request):
    """POST /api/v1/render — render a template with variable substitution."""
    serializer = RenderRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    billing_org = billing_organization_for_org(org)

    # Rate limit check
    if billing_org.rendered_emails_count >= billing_org.rendered_emails_limit:
        return Response(
            {
                'error': {
                    'code': 'EMAIL_RENDER_LIMIT_EXCEEDED',
                    'message': 'Monthly rendered email limit exceeded for current plan.',
                }
            },
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    # Resolve json_data
    template_id = serializer.validated_data.get('template_id')
    if template_id:
        try:
            template_obj = Template.objects.for_org(org).get(pk=template_id)
        except Template.DoesNotExist:
            return Response(
                {'error': {'code': 'TEMPLATE_NOT_FOUND', 'message': 'Template not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        json_data = template_obj.json_data
    else:
        json_data = serializer.validated_data['json_data']

    variables = serializer.validated_data['variables']

    # Strict mode: all used variables must be provided
    used_keys = extract_variable_keys(json_data)
    provided_keys = set(variables.keys())
    missing_keys = used_keys - provided_keys
    if missing_keys:
        return Response(
            {
                'error': {
                    'code': 'MISSING_VARIABLES',
                    'message': f'Missing required variables: {", ".join(sorted(missing_keys))}',
                    'missing_variables': sorted(missing_keys),
                }
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Substitute and render
    substituted_data = substitute_variables(json_data, variables)
    result = render_email_html(substituted_data)

    billing_org.rendered_emails_count += 1
    billing_org.save(update_fields=['rendered_emails_count', 'updated_at'])

    return Response({
        'html': result['html'],
        'warnings': result.get('warnings', []),
        'variables_used': sorted(used_keys),
    })
