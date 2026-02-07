import hashlib
import secrets
import uuid

from django.db import models


class Organization(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    allowed_origins = models.JSONField(default=list, blank=True)
    storage_used_bytes = models.BigIntegerField(default=0)
    storage_limit_bytes = models.BigIntegerField(default=104857600)  # 100MB
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.name

    @property
    def is_pro(self):
        return self.plan in ('pro', 'enterprise')


class ApiKey(models.Model):
    ENVIRONMENT_CHOICES = [
        ('live', 'Live'),
        ('test', 'Test'),
    ]
    SCOPE_CHOICES = [
        ('full', 'Full Access'),
        ('readonly', 'Read Only'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='api_keys')
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)
    key_prefix = models.CharField(max_length=20)
    environment = models.CharField(max_length=10, choices=ENVIRONMENT_CHOICES)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default='full')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'api_keys'
        indexes = [
            models.Index(fields=['org', 'is_active']),
        ]

    def __str__(self):
        return f"{self.key_prefix}... ({self.org.name})"

    @staticmethod
    def generate_key(environment='live'):
        prefix = f"mc_{environment}_"
        random_part = secrets.token_hex(16)
        raw_key = f"{prefix}{random_part}"
        return raw_key

    @staticmethod
    def hash_key(raw_key):
        return hashlib.sha256(raw_key.encode()).hexdigest()
