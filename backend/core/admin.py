from django.contrib import admin, messages

from core.models import Account, ApiKey, Organization, Plan, UserOrganization


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'slug', 'monthly_price_usd',
        'rendered_emails_limit', 'storage_limit_mb',
        'max_upload_size_mb', 'max_media_files_per_upload',
        'is_default', 'sort_order',
    ]
    list_editable = [
        'monthly_price_usd', 'rendered_emails_limit', 'storage_limit_mb',
        'max_upload_size_mb', 'max_media_files_per_upload',
        'is_default', 'sort_order',
    ]
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'plan',
        'rendered_emails_count', 'rendered_emails_limit',
        'storage_used_bytes', 'storage_limit_mb',
        'created_at',
    ]
    list_filter = ['plan']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['plan', 'rendered_emails_limit', 'storage_limit_mb']
    actions = ['reset_render_count', 'reset_storage_used', 'apply_plan_limits']

    @admin.action(description='Reset rendered emails count to 0')
    def reset_render_count(self, request, queryset):
        count = queryset.update(rendered_emails_count=0)
        self.message_user(request, f'Reset render count for {count} account(s).', messages.SUCCESS)

    @admin.action(description='Reset storage used to 0')
    def reset_storage_used(self, request, queryset):
        count = queryset.update(storage_used_bytes=0)
        self.message_user(request, f'Reset storage used for {count} account(s).', messages.SUCCESS)

    @admin.action(description='Apply plan limits (resets limits to plan defaults)')
    def apply_plan_limits(self, request, queryset):
        for account in queryset:
            account.apply_plan_limits(save=True)
        self.message_user(request, f'Applied plan limits for {queryset.count()} account(s).', messages.SUCCESS)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']


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
