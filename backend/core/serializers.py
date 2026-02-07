from rest_framework import serializers

from core.models import Organization, ApiKey


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'plan', 'allowed_origins',
                  'storage_used_bytes', 'storage_limit_bytes', 'created_at']
        read_only_fields = ['id', 'created_at']


class SessionRequestSerializer(serializers.Serializer):
    origin = serializers.URLField(required=True)


class SessionResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    expires_at = serializers.DateTimeField()
    config = serializers.DictField()
