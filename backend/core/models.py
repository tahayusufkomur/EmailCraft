import hashlib
import secrets
import uuid

from django.contrib.auth.models import User
from django.conf import settings
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    MB = 1024 * 1024

    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    monthly_price_usd = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    rendered_emails_limit = models.BigIntegerField(default=1000)
    storage_limit_mb = models.PositiveIntegerField(default=1024)  # 1 GB
    max_upload_size_mb = models.PositiveIntegerField(default=5)
    max_media_files_per_upload = models.PositiveIntegerField(default=5)
    is_default = models.BooleanField(default=False, help_text='New orgs get this plan when no plan is specified.')
    sort_order = models.PositiveIntegerField(default=0)
    stripe_price_id = models.CharField(max_length=120, blank=True, null=True)
    stripe_product_id = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        db_table = 'plans'
        ordering = ['sort_order', 'monthly_price_usd']

    def __str__(self):
        return self.name

    @property
    def storage_limit_bytes(self):
        return self.storage_limit_mb * self.MB

    @property
    def max_upload_size_bytes(self):
        return self.max_upload_size_mb * self.MB

    @classmethod
    def get_default(cls):
        return cls.objects.filter(is_default=True).first() or cls.objects.order_by('sort_order').first()


class Account(models.Model):
    """Billing account — one per user. Holds plan, usage counters, and Stripe info."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='account')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')
    rendered_emails_count = models.BigIntegerField(default=0)
    rendered_emails_limit = models.BigIntegerField(default=1000)
    storage_used_bytes = models.BigIntegerField(default=0)
    storage_limit_mb = models.PositiveIntegerField(default=1024)  # 1 GB
    stripe_customer_id = models.CharField(max_length=120, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=120, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'

    def __str__(self):
        return f"{self.user.username} ({self.plan_slug})"

    @property
    def plan_slug(self):
        return self.plan.slug if self.plan else 'free'

    @property
    def is_pro(self):
        return self.plan_slug in ('pro', 'enterprise')

    @property
    def storage_limit_bytes(self):
        return self.storage_limit_mb * Plan.MB

    @property
    def max_upload_size_bytes(self):
        return self.plan.max_upload_size_bytes if self.plan else 5 * Plan.MB

    @property
    def max_media_files_per_upload(self):
        return self.plan.max_media_files_per_upload if self.plan else 1

    def apply_plan_limits(self, save=True):
        p = self.plan or Plan.get_default()
        if p:
            self.rendered_emails_limit = p.rendered_emails_limit
            self.storage_limit_mb = p.storage_limit_mb
        if save:
            self.save(update_fields=['rendered_emails_limit', 'storage_limit_mb', 'updated_at'])


class Organization(models.Model):
    THEME_MODE_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    EMAIL_BACKGROUND_STYLE_CHOICES = [
        ('none', 'Solid'),
        ('aurora', 'Aurora'),
        ('sunset-glow', 'Sunset Glow'),
        ('mint-weave', 'Mint Weave'),
        ('midnight-grid', 'Midnight Grid'),
        ('paper-rings', 'Paper Rings'),
    ]
    BUILDER_THEME_CHOICES = [
        ('light-breeze', 'Light Breeze'),
        ('light-paper', 'Light Paper'),
        ('dark-slate', 'Dark Slate'),
        ('dark-cosmos', 'Dark Cosmos'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    allowed_origins = models.JSONField(default=list, blank=True)
    available_variables = models.JSONField(default=list, blank=True)
    show_logo = models.BooleanField(default=True)
    show_export_html_button = models.BooleanField(default=True)
    theme_mode = models.CharField(max_length=10, choices=THEME_MODE_CHOICES, default='system')
    email_background_style = models.CharField(
        max_length=30,
        choices=EMAIL_BACKGROUND_STYLE_CHOICES,
        default='none',
    )
    email_background_color = models.CharField(max_length=20, default='#f4f4f4')
    default_palette = models.CharField(max_length=50, blank=True, default='')
    custom_palette = models.JSONField(default=dict, blank=True)
    builder_theme = models.CharField(max_length=30, choices=BUILDER_THEME_CHOICES, default='light-breeze')
    test_key_version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.name


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


class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='sessions')
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sessions'
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Session {self.id} ({self.org.name})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @staticmethod
    def generate_token():
        return f"sess_{secrets.token_hex(32)}"

    @staticmethod
    def hash_token(raw_token):
        return hashlib.sha256(raw_token.encode()).hexdigest()


class MagicLink(models.Model):
    email = models.EmailField(db_index=True)
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'magic_links'
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"MagicLink {self.email} (expires {self.expires_at})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @property
    def is_used(self):
        return self.used_at is not None

    @staticmethod
    def hash_token(raw_token):
        return hashlib.sha256(raw_token.encode()).hexdigest()


def derive_reusable_test_api_key(org):
    seed = f'{settings.SECRET_KEY}:{org.id}:{org.test_key_version}'
    digest = hashlib.sha256(seed.encode()).hexdigest()[:32]
    return f'mc_test_{digest}'


def ensure_reusable_test_api_key(org, refresh=False):
    if refresh:
        org.test_key_version += 1
        org.save(update_fields=['test_key_version', 'updated_at'])

    raw_key = derive_reusable_test_api_key(org)
    requested_hash = ApiKey.hash_key(raw_key)

    existing_for_hash = ApiKey.objects.filter(key_hash=requested_hash).first()
    if existing_for_hash and existing_for_hash.org_id != org.id:
        raise ValueError('Reusable test API key collision for another organization.')

    ApiKey.objects.filter(
        org=org,
        environment='test',
        is_active=True,
        revoked_at__isnull=True,
    ).exclude(key_hash=requested_hash).update(is_active=False, revoked_at=timezone.now())

    if existing_for_hash:
        existing_for_hash.environment = 'test'
        existing_for_hash.scope = 'full'
        existing_for_hash.key_prefix = raw_key[:12]
        existing_for_hash.is_active = True
        existing_for_hash.revoked_at = None
        existing_for_hash.save(update_fields=['environment', 'scope', 'key_prefix', 'is_active', 'revoked_at'])
        api_key = existing_for_hash
    else:
        api_key = ApiKey.objects.create(
            org=org,
            key_hash=requested_hash,
            key_prefix=raw_key[:12],
            environment='test',
            scope='full',
        )

    return raw_key, api_key


class UserOrganization(models.Model):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('member', 'Member'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_memberships')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_organizations'
        indexes = [
            models.Index(fields=['organization', 'role'], name='user_org_role_idx'),
        ]
        constraints = [
            models.UniqueConstraint(fields=['user', 'organization'], name='unique_user_organization_membership'),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.organization.name} ({self.role})"


def organizations_for_user(user):
    return Organization.objects.filter(memberships__user=user).distinct()


def primary_organization_for_user(user):
    membership = (
        UserOrganization.objects.select_related('organization')
        .filter(user=user)
        .order_by('created_at')
        .first()
    )
    return membership.organization if membership else None


def get_or_create_account(user):
    """Get or create the billing Account for a user."""
    account, created = Account.objects.get_or_create(
        user=user,
        defaults={'plan': Plan.get_default()},
    )
    if created:
        account.apply_plan_limits(save=True)
    return account


def account_for_user(user):
    """Get the Account for a user, creating one if needed."""
    return get_or_create_account(user)


def account_for_org(org):
    """Get the billing Account for an org (via its owner)."""
    owner_membership = (
        UserOrganization.objects.select_related('user')
        .filter(organization=org, role='owner')
        .order_by('created_at')
        .first()
    )
    if not owner_membership:
        return None
    return account_for_user(owner_membership.user)


# Backward compat aliases
def billing_organization_for_user(user):
    return account_for_user(user)


def billing_organization_for_org(org):
    return account_for_org(org)
