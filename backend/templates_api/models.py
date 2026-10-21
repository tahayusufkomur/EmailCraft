import uuid

from django.db import models
from django.db.models import Q

from core.models import Organization


class TenantManager(models.Manager):
    def for_org(self, org):
        return self.filter(org=org)

    def shared(self):
        return self.filter(org__isnull=True, is_gallery=True, is_draft=False)

    def visible_to_org(self, org):
        return self.filter(Q(org=org) | Q(org__isnull=True, is_gallery=True, is_draft=False))


class Template(models.Model):
    CATEGORY_CHOICES = [
        ('welcome', 'Welcome'),
        ('newsletter', 'Newsletter'),
        ('promotional', 'Promotional'),
        ('transactional', 'Transactional'),
        ('event', 'Event'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='templates', null=True, blank=True,
    )
    name = models.CharField(max_length=255)
    json_data = models.JSONField()
    thumbnail_url = models.URLField(blank=True, null=True)
    is_gallery = models.BooleanField(default=False, db_index=True)
    is_premium = models.BooleanField(default=False, db_index=True)
    tags = models.JSONField(default=list, blank=True)
    category = models.CharField(max_length=50, blank=True, choices=CATEGORY_CHOICES)
    is_draft = models.BooleanField(default=False)
    source_template = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='copies',
    )
    is_modified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()

    class Meta:
        db_table = 'templates'
        indexes = [
            models.Index(fields=['org', 'created_at']),
            models.Index(fields=['is_gallery', 'category']),
            models.Index(fields=['is_gallery', 'is_premium'], name='tmpl_gallery_prem_idx'),
            models.Index(fields=['org', 'source_template'], name='tmpl_org_source_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['org', 'source_template'],
                condition=models.Q(source_template__isnull=False),
                name='unique_org_source_template',
            ),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class UploadedImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='images')
    s3_key = models.CharField(max_length=500, unique=True)
    url = models.URLField()
    filename = models.CharField(max_length=255, blank=True, default='')
    thumbnail_s3_key = models.CharField(max_length=500, blank=True, default='')
    thumbnail_url = models.URLField(blank=True, null=True)
    file_size = models.IntegerField()
    content_type = models.CharField(max_length=50)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    is_orphaned = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = TenantManager()

    class Meta:
        db_table = 'uploaded_images'
        indexes = [
            models.Index(fields=['org', 'created_at']),
            models.Index(fields=['is_orphaned', 'created_at']),
        ]

    def __str__(self):
        return self.s3_key


class GenerationJob(models.Model):
    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('running', 'Running'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    KIND_CHOICES = [('generate', 'Generate'), ('edit', 'Edit')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='generation_jobs')
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default='generate')
    brief = models.TextField()  # an edit's requested change
    category = models.CharField(max_length=50, choices=Template.CATEGORY_CHOICES, blank=True)
    source = models.JSONField(null=True, blank=True)  # edit: the email as it was
    block_id = models.CharField(max_length=64, blank=True)  # edit: the block the customer selected
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='queued')
    step = models.CharField(max_length=16, blank=True, default='')
    activity = models.CharField(max_length=80, blank=True)  # status line signed by the role at work
    partial = models.JSONField(null=True, blank=True)  # live preview while the model writes
    template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    result = models.JSONField(null=True, blank=True)  # edit: the changed email
    error = models.TextField(blank=True)
    warnings = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = TenantManager()

    class Meta:
        db_table = 'generation_jobs'
