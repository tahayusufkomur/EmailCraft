import secrets

import boto3
from django.conf import settings
from django.db.models import Q
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
        if self.action in ('list', 'retrieve'):
            return Template.objects.visible_to_org(self.request.org)
        return Template.objects.for_org(self.request.org)

    def perform_create(self, serializer):
        serializer.save(org=self.request.org, is_gallery=False)

    def perform_update(self, serializer):
        serializer.save(org=self.request.org, is_gallery=False)


@api_view(['GET'])
def gallery_list(request):
    """GET /api/v1/gallery — list prebuilt gallery templates."""
    queryset = Template.objects.shared()

    category = request.query_params.get('category')
    if category:
        queryset = queryset.filter(category=category)

    serializer = GalleryTemplateSerializer(queryset, many=True)
    return Response({'data': serializer.data})



@api_view(['GET'])
def media_list(request):
    """GET /api/v1/media — list uploaded media for the current organization."""
    queryset = UploadedImage.objects.for_org(request.org)
    search_query = (request.query_params.get('q') or '').strip()
    if search_query:
        queryset = queryset.filter(
            Q(filename__icontains=search_query)
            | Q(url__icontains=search_query)
        )

    sort_field_key = (request.query_params.get('sort') or 'date').strip().lower()
    order_key = (request.query_params.get('order') or 'desc').strip().lower()
    sort_field_map = {
        'date': 'created_at',
        'name': 'filename',
        'size': 'file_size',
    }
    sort_field = sort_field_map.get(sort_field_key, 'created_at')
    ordering_prefix = '' if order_key == 'asc' else '-'
    queryset = queryset.order_by(f'{ordering_prefix}{sort_field}', '-created_at')

    try:
        limit = int(request.query_params.get('limit', 24))
    except (TypeError, ValueError):
        limit = 24
    try:
        offset = int(request.query_params.get('offset', 0))
    except (TypeError, ValueError):
        offset = 0

    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100
    if offset < 0:
        offset = 0

    total = queryset.count()
    page_items = list(queryset[offset:offset + limit])
    has_more = offset + len(page_items) < total
    next_offset = offset + len(page_items) if has_more else None

    serializer = UploadedImageListSerializer(page_items, many=True)
    return Response({
        'results': serializer.data,
        'total': total,
        'has_more': has_more,
        'next_offset': next_offset,
        'limit': limit,
        'offset': offset,
    })


@api_view(['POST'])
def presign_upload(request):
    """POST /api/v1/upload/presign — get an S3 presigned URL for image upload."""
    serializer = PresignRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    billing_org = billing_organization_for_org(org)
    data = serializer.validated_data
    upload_kind = data.get('kind', 'original')
    upload_batch_size = data.get('upload_batch_size', 1)

    if upload_kind == 'original' and upload_batch_size > billing_org.max_media_files_per_upload:
        return Response(
            {
                'error': {
                    'code': 'TOO_MANY_FILES_IN_UPLOAD',
                    'message': (
                        'Too many files selected for one upload. '
                        f'Max is {billing_org.max_media_files_per_upload} files.'
                    ),
                }
            },
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

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

    requested_filename = data['filename'].split('/')[-1].split('\\')[-1].strip()
    safe_filename = requested_filename or 'upload'
    safe_filename = re.sub(r'[^A-Za-z0-9._-]+', '_', safe_filename).strip('._') or 'upload'
    filename_with_prefix = f'{secrets.token_hex(6)}_{safe_filename}'

    # Generate S3 key: emailBuilder/<organization>/<file>
    s3_directory = 'thumbs' if upload_kind == 'thumbnail' else ''
    if s3_directory:
        s3_key = f"{settings.AWS_S3_KEY_PREFIX}/{org.id}/{s3_directory}/{filename_with_prefix}"
    else:
        s3_key = f"{settings.AWS_S3_KEY_PREFIX}/{org.id}/{filename_with_prefix}"
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

    image_id = None
    if upload_kind == 'thumbnail':
        image = UploadedImage.objects.for_org(org).filter(id=data.get('image_id')).first()
        if not image:
            return Response(
                {'error': {'code': 'IMAGE_NOT_FOUND', 'message': 'Image not found for thumbnail upload.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        image.thumbnail_s3_key = s3_key
        image.thumbnail_url = file_url
        image.save(update_fields=['thumbnail_s3_key', 'thumbnail_url'])
        image_id = str(image.id)
    else:
        image = UploadedImage.objects.create(
            org=org,
            s3_key=s3_key,
            url=file_url,
            filename=filename_with_prefix[:255],
            file_size=data['file_size'],
            content_type=data['content_type'],
        )
        image_id = str(image.id)

    # Update storage used for both original and thumbnail uploads
    billing_org.storage_used_bytes += data['file_size']
    billing_org.save(update_fields=['storage_used_bytes'])

    return Response({
        'upload_url': upload_url,
        'file_url': file_url,
        'image_id': image_id,
        'kind': upload_kind,
        'expires_at': None,  # Will be real expiry in production
    })


@api_view(['POST'])
def export_html(request):
    """POST /api/v1/export/html — convert template JSON to email HTML.

    Used for previews and editor exports. Does not count against render quota.
    Only /render (used for actual sending) counts against quota.
    """
    serializer = ExportRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    json_data = serializer.validated_data['json_data']
    variables_mode = serializer.validated_data['variables_mode']

    result = render_email_html(json_data, variables_mode)

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
