from rest_framework import serializers

from core.models import ApiKey, Organization, UserOrganization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'plan', 'allowed_origins',
                  'rendered_emails_count', 'rendered_emails_limit',
                  'storage_used_bytes', 'storage_limit_bytes', 'created_at']
        read_only_fields = ['id', 'created_at']


class SessionRequestSerializer(serializers.Serializer):
    origin = serializers.URLField(required=True)


class SessionResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    expires_at = serializers.DateTimeField()
    config = serializers.DictField()


class SubscribeRequestSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=[choice[0] for choice in Organization.PLAN_CHOICES])


class SiteRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    organization_name = serializers.CharField(max_length=255)


class UserOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOrganization
        fields = ['role', 'created_at']


class SiteUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()


class SiteMeSerializer(serializers.Serializer):
    user = SiteUserSerializer()
    organization = OrganizationSerializer()


class SiteDashboardSerializer(serializers.Serializer):
    plan = serializers.CharField()
    rendered_emails_count = serializers.IntegerField()
    rendered_emails_limit = serializers.IntegerField()
    storage_used_bytes = serializers.IntegerField()
    storage_limit_bytes = serializers.IntegerField()
    stripe_subscription_id = serializers.CharField(allow_null=True)
