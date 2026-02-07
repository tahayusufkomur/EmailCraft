from django.contrib import admin

from core.models import Organization, ApiKey


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'plan', 'is_active', 'created_at']
    list_filter = ['plan', 'is_active']
    search_fields = ['name', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ['key_prefix', 'org', 'environment', 'scope', 'is_active', 'created_at']
    list_filter = ['environment', 'scope', 'is_active']
    search_fields = ['key_prefix', 'org__name']
    readonly_fields = ['id', 'key_hash', 'created_at']
