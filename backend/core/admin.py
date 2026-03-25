from django.contrib import admin, messages

from core.models import ApiKey, Organization, UserOrganization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'email', 'plan',
        'rendered_emails_count', 'rendered_emails_limit',
        'storage_used_bytes', 'storage_limit_bytes',
        'is_active', 'created_at',
    ]
    list_filter = ['plan', 'is_active']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    list_editable = ['plan', 'rendered_emails_limit', 'storage_limit_bytes']
    actions = ['reset_render_count', 'reset_storage_used', 'apply_plan_limits']

    @admin.action(description='Reset rendered emails count to 0')
    def reset_render_count(self, request, queryset):
        count = queryset.update(rendered_emails_count=0)
        self.message_user(request, f'Reset render count for {count} org(s).', messages.SUCCESS)

    @admin.action(description='Reset storage used to 0')
    def reset_storage_used(self, request, queryset):
        count = queryset.update(storage_used_bytes=0)
        self.message_user(request, f'Reset storage used for {count} org(s).', messages.SUCCESS)

    @admin.action(description='Apply plan limits from settings (resets limits to plan defaults)')
    def apply_plan_limits(self, request, queryset):
        for org in queryset:
            org.apply_plan_limits(save=True)
        self.message_user(request, f'Applied plan limits for {queryset.count()} org(s).', messages.SUCCESS)


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ['key_prefix', 'org', 'environment', 'scope', 'is_active', 'created_at']
    list_filter = ['environment', 'scope', 'is_active']
    search_fields = ['key_prefix', 'org__name']
    readonly_fields = ['id', 'key_hash', 'created_at']


@admin.register(UserOrganization)
class UserOrganizationAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'role', 'created_at']
    list_filter = ['role']
    search_fields = ['user__username', 'user__email', 'organization__name']
