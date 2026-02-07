import uuid

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from templates_api.models import Template, UploadedImage
from templates_api.serializers import (
    ExportRequestSerializer,
    GalleryTemplateSerializer,
    PresignRequestSerializer,
    TemplateCreateSerializer,
    TemplateDetailSerializer,
    TemplateListSerializer,
)
from templates_api.export_engine import render_email_html


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


@api_view(['POST'])
def presign_upload(request):
    """POST /api/v1/upload/presign — get an S3 presigned URL for image upload."""
    serializer = PresignRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    org = request.org
    data = serializer.validated_data

    # Check plan-based upload size limit
    max_size = settings.MAX_UPLOAD_SIZE_PRO if org.is_pro else settings.MAX_UPLOAD_SIZE_FREE
    if data['file_size'] > max_size:
        return Response(
            {'error': {'code': 'FILE_TOO_LARGE', 'message': f'Max file size is {max_size} bytes.'}},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    # Check storage limit
    if org.storage_used_bytes + data['file_size'] > org.storage_limit_bytes:
        return Response(
            {'error': {'code': 'STORAGE_LIMIT_EXCEEDED', 'message': 'Organization storage limit exceeded.'}},
            status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    # Generate S3 key
    file_ext = data['filename'].rsplit('.', 1)[-1] if '.' in data['filename'] else 'bin'
    s3_key = f"uploads/{org.id}/{uuid.uuid4().hex}.{file_ext}"

    # In production this would use boto3 to generate a presigned URL.
    # For now, return a mock response for development.
    cdn_domain = settings.AWS_CLOUDFRONT_DOMAIN or f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    file_url = f"{cdn_domain}/{s3_key}"

    # Create a placeholder upload_url (would be real presigned URL in production)
    upload_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"

    # Record the image
    UploadedImage.objects.create(
        org=org,
        s3_key=s3_key,
        url=file_url,
        file_size=data['file_size'],
        content_type=data['content_type'],
    )

    # Update storage used
    org.storage_used_bytes += data['file_size']
    org.save(update_fields=['storage_used_bytes'])

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

    json_data = serializer.validated_data['json_data']
    variables_mode = serializer.validated_data['variables_mode']

    result = render_email_html(json_data, variables_mode)

    return Response({
        'html': result['html'],
        'warnings': result.get('warnings', []),
    })
