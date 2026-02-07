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
    kind = serializers.ChoiceField(choices=['original', 'thumbnail'], required=False, default='original')
    image_id = serializers.UUIDField(required=False, allow_null=True)
    upload_batch_size = serializers.IntegerField(required=False, min_value=1, default=1)

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

    def validate(self, attrs):
        kind = attrs.get('kind', 'original')
        image_id = attrs.get('image_id')
        if kind == 'thumbnail' and not image_id:
            raise serializers.ValidationError("image_id is required when kind is 'thumbnail'.")
        return attrs


class UploadedImageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedImage
        fields = [
            'id',
            'url',
            'filename',
            'thumbnail_url',
            'file_size',
            'content_type',
            'width',
            'height',
            'created_at',
        ]
        read_only_fields = fields


class ExportRequestSerializer(serializers.Serializer):
    json_data = serializers.JSONField()
    variables_mode = serializers.ChoiceField(
        choices=['placeholders', 'defaults'],
        default='placeholders',
    )


class RenderRequestSerializer(serializers.Serializer):
    template_id = serializers.UUIDField(required=False)
    json_data = serializers.JSONField(required=False)
    variables = serializers.DictField(
        child=serializers.CharField(max_length=10000),
        required=True,
    )

    def validate_variables(self, value):
        from templates_api.export_engine import validate_variable_key

        invalid_keys = [k for k in value if not validate_variable_key(k)]
        if invalid_keys:
            raise serializers.ValidationError(
                f"Invalid variable key(s): {', '.join(invalid_keys)}. "
                "Keys must contain only letters, digits, and underscores, "
                "and start with a letter or underscore."
            )
        return value

    def validate_json_data(self, value):
        if value is not None:
            size = sys.getsizeof(json.dumps(value))
            if size > settings.MAX_TEMPLATE_SIZE:
                raise serializers.ValidationError(
                    f"Template JSON exceeds maximum size of {settings.MAX_TEMPLATE_SIZE} bytes."
                )
        return value

    def validate(self, attrs):
        if not attrs.get('template_id') and not attrs.get('json_data'):
            raise serializers.ValidationError(
                "Either 'template_id' or 'json_data' must be provided."
            )
        if attrs.get('template_id') and attrs.get('json_data'):
            raise serializers.ValidationError(
                "Provide either 'template_id' or 'json_data', not both."
            )
        return attrs
