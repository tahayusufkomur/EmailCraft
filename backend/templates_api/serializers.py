import json
import sys

from django.conf import settings
from rest_framework import serializers

from templates_api.models import Template, UploadedImage


class TemplateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'thumbnail_url', 'category', 'is_draft', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TemplateDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'json_data', 'thumbnail_url', 'category',
                  'is_draft', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_json_data(self, value):
        size = sys.getsizeof(json.dumps(value))
        if size > settings.MAX_TEMPLATE_SIZE:
            raise serializers.ValidationError(
                f"Template JSON exceeds maximum size of {settings.MAX_TEMPLATE_SIZE} bytes."
            )
        return value


class TemplateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['name', 'json_data', 'category', 'is_draft']

    def validate_json_data(self, value):
        size = sys.getsizeof(json.dumps(value))
        if size > settings.MAX_TEMPLATE_SIZE:
            raise serializers.ValidationError(
                f"Template JSON exceeds maximum size of {settings.MAX_TEMPLATE_SIZE} bytes."
            )
        return value


class GalleryTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ['id', 'name', 'category', 'thumbnail_url', 'json_data']


class PresignRequestSerializer(serializers.Serializer):
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=50)
    file_size = serializers.IntegerField()

    def validate_content_type(self, value):
        if value not in settings.ALLOWED_UPLOAD_TYPES:
            raise serializers.ValidationError(
                f"File type '{value}' is not allowed. Allowed types: {', '.join(settings.ALLOWED_UPLOAD_TYPES)}"
            )
        return value

    def validate_file_size(self, value):
        if value <= 0:
            raise serializers.ValidationError("File size must be positive.")
        return value


class ExportRequestSerializer(serializers.Serializer):
    json_data = serializers.JSONField()
    variables_mode = serializers.ChoiceField(
        choices=['placeholders', 'defaults'],
        default='placeholders',
    )
