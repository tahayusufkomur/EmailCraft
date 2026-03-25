from rest_framework import serializers

from core.models import ApiKey, Organization, UserOrganization


class OrganizationVariableSerializer(serializers.Serializer):
    key = serializers.CharField(max_length=100)
    label = serializers.CharField(max_length=100)
    defaultValue = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=['text', 'url'], required=False, default='text')

    def validate_key(self, value):
        from templates_api.export_engine import validate_variable_key

        normalized = value.strip()
        if not validate_variable_key(normalized):
            raise serializers.ValidationError(
                'Variable key must contain only letters, digits, and underscores, '
                'and start with a letter or underscore.'
            )
        return normalized

    def validate_label(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError('Variable label cannot be empty.')
        return normalized


def validate_organization_variables(value):
    seen = set()
    duplicate_keys = set()
    for item in value:
        key = item['key']
        if key in seen:
            duplicate_keys.add(key)
        else:
            seen.add(key)
    duplicate_keys = sorted(duplicate_keys)
    if duplicate_keys:
        raise serializers.ValidationError(
            f"Duplicate variable key(s): {', '.join(duplicate_keys)}."
        )
    return value


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'allowed_origins',
                  'available_variables',
                  'show_logo', 'show_export_html_button', 'theme_mode',
                  'builder_theme',
                  'email_background_style', 'email_background_color',
                  'created_at']
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
    plan = serializers.CharField(max_length=50)


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
    available_variables = OrganizationVariableSerializer(many=True, required=False, default=list)
    show_logo = serializers.BooleanField(required=False, default=True)
    show_export_html_button = serializers.BooleanField(required=False, default=True)
    theme_mode = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.THEME_MODE_CHOICES],
        required=False,
        default='system',
    )
    builder_theme = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.BUILDER_THEME_CHOICES],
        required=False,
        default='light-breeze',
    )
    email_background_style = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.EMAIL_BACKGROUND_STYLE_CHOICES],
        required=False,
        default='none',
    )
    email_background_color = serializers.RegexField(
        regex=r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
        required=False,
        default='#f4f4f4',
    )

    def validate_available_variables(self, value):
        return validate_organization_variables(value)


class SiteOrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    allowed_origins = serializers.ListField(
        child=serializers.URLField(),
        required=False,
    )
    available_variables = OrganizationVariableSerializer(many=True, required=False)
    show_logo = serializers.BooleanField(required=False)
    show_export_html_button = serializers.BooleanField(required=False)
    theme_mode = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.THEME_MODE_CHOICES],
        required=False,
    )
    builder_theme = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.BUILDER_THEME_CHOICES],
        required=False,
    )
    email_background_style = serializers.ChoiceField(
        choices=[choice[0] for choice in Organization.EMAIL_BACKGROUND_STYLE_CHOICES],
        required=False,
    )
    email_background_color = serializers.RegexField(
        regex=r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
        required=False,
    )

    def validate_available_variables(self, value):
        return validate_organization_variables(value)


class SiteApiKeyCreateSerializer(serializers.Serializer):
    refresh = serializers.BooleanField(required=False, default=False)


class SiteProvisionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)


class UserOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOrganization
        fields = ['role', 'created_at']


class SiteUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()


class SiteMeSerializer(serializers.Serializer):
    user = SiteUserSerializer()
    organization = OrganizationSerializer()


class SiteDashboardSerializer(serializers.Serializer):
    plan = serializers.CharField()
    rendered_emails_count = serializers.IntegerField()
    rendered_emails_limit = serializers.IntegerField()
    max_media_files_per_upload = serializers.IntegerField()
    storage_used_bytes = serializers.IntegerField()
    storage_limit_bytes = serializers.IntegerField()
    organizations_count = serializers.IntegerField()
    stripe_subscription_id = serializers.CharField(allow_null=True)
