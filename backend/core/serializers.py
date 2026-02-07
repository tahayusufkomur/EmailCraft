from rest_framework import serializers

from core.models import ApiKey, Organization, UserOrganization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'plan', 'allowed_origins',
                  'show_logo', 'show_export_html_button', 'theme_mode',
                  'rendered_emails_count', 'rendered_emails_limit',
                  'storage_used_bytes', 'storage_limit_bytes', 'created_at']
        read_only_fields = ['id', 'created_at']


class ApiKeySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiKey
        fields = [
            'id',
            'key_prefix',
            'environment',
            'scope',
            'is_active',
            'last_used_at',
            'created_at',
        ]


class OrganizationWithApiKeysSerializer(OrganizationSerializer):
    api_keys = serializers.SerializerMethodField()

    class Meta(OrganizationSerializer.Meta):
        fields = [*OrganizationSerializer.Meta.fields, 'api_keys']

    def get_api_keys(self, obj):
        keys = obj.api_keys.filter(is_active=True, revoked_at__isnull=True).order_by('-created_at')
        return ApiKeySummarySerializer(keys, many=True).data


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


class SiteLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=255)
    password = serializers.CharField(write_only=True, min_length=1)


class SiteOrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    allowed_origins = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        default=list,
    )
    show_logo = serializers.BooleanField(required=False, default=True)
    show_export_html_button = serializers.BooleanField(required=False, default=True)
    theme_mode = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.THEME_MODE_CHOICES],
        required=False,
        default='system',
    )


class SiteOrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    allowed_origins = serializers.ListField(
        child=serializers.URLField(),
        required=False,
    )
    show_logo = serializers.BooleanField(required=False)
    show_export_html_button = serializers.BooleanField(required=False)
    theme_mode = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.THEME_MODE_CHOICES],
        required=False,
    )


class SiteApiKeyCreateSerializer(serializers.Serializer):
    refresh = serializers.BooleanField(required=False, default=False)


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
    organizations_count = serializers.IntegerField()
    stripe_subscription_id = serializers.CharField(allow_null=True)
