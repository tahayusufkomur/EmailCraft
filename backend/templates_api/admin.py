from django.contrib import admin

from templates_api.models import Template, UploadedImage


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'org', 'category', 'is_gallery', 'is_draft', 'updated_at']
    list_filter = ['is_gallery', 'category', 'is_draft']
    search_fields = ['name', 'org__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):
    list_display = ['s3_key', 'org', 'file_size', 'content_type', 'is_orphaned', 'created_at']
    list_filter = ['content_type', 'is_orphaned']
    search_fields = ['s3_key', 'org__name']
    readonly_fields = ['id', 'created_at']
