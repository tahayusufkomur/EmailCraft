from django.contrib.admin.apps import AdminConfig


class TwoFactorAdminConfig(AdminConfig):
    """Drop-in replacement for 'django.contrib.admin' in INSTALLED_APPS."""
    default_site = 'admin_2fa.site.TwoFactorAdminSite'
