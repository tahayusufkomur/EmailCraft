import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class AdminLoginOTP(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_otps',
    )
    code_hash = models.CharField(max_length=64)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Admin Login OTP'
        verbose_name_plural = 'Admin Login OTPs'

    @classmethod
    def create_for_user(cls, user):
        """Generate a new OTP for the user. Returns (otp_instance, raw_code)."""
        raw_code = f'{secrets.randbelow(1_000_000):06d}'
        code_hash = hashlib.sha256(raw_code.encode()).hexdigest()
        token = secrets.token_urlsafe(32)
        expiry_seconds = getattr(settings, 'ADMIN_OTP_EXPIRY_SECONDS', 300)
        otp = cls.objects.create(
            user=user,
            code_hash=code_hash,
            token=token,
            expires_at=timezone.now() + timedelta(seconds=expiry_seconds),
        )
        return otp, raw_code

    def verify(self, code):
        """Verify the code. Returns True on success, False on failure."""
        self.attempts += 1
        self.save(update_fields=['attempts'])

        max_attempts = getattr(settings, 'ADMIN_LOGIN_MAX_ATTEMPTS', 5)
        if self.attempts > max_attempts:
            return False
        if self.used:
            return False
        if timezone.now() > self.expires_at:
            return False

        submitted_hash = hashlib.sha256(code.encode()).hexdigest()
        if secrets.compare_digest(submitted_hash, self.code_hash):
            self.used = True
            self.save(update_fields=['used'])
            return True
        return False

    @property
    def is_exhausted(self):
        max_attempts = getattr(settings, 'ADMIN_LOGIN_MAX_ATTEMPTS', 5)
        return self.attempts >= max_attempts or self.used or timezone.now() > self.expires_at

    @classmethod
    def cleanup_expired(cls):
        cls.objects.filter(expires_at__lt=timezone.now() - timedelta(hours=1)).delete()


class AdminLoginAttempt(models.Model):
    email = models.EmailField(db_index=True)
    attempted_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def is_rate_limited(cls, email):
        max_attempts = getattr(settings, 'ADMIN_LOGIN_MAX_ATTEMPTS', 5)
        window_minutes = getattr(settings, 'ADMIN_LOGIN_RATE_WINDOW_MINUTES', 15)
        cutoff = timezone.now() - timedelta(minutes=window_minutes)
        count = cls.objects.filter(email=email, attempted_at__gte=cutoff).count()
        return count >= max_attempts

    @classmethod
    def record(cls, email):
        cls.objects.create(email=email)

    @classmethod
    def cleanup_old(cls):
        cls.objects.filter(attempted_at__lt=timezone.now() - timedelta(hours=1)).delete()
