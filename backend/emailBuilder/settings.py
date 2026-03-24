"""
Django settings for emailBuilder project.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
load_dotenv(ROOT_DIR / '.env')

APP_ENV = os.environ.get('APP_ENV', 'dev').lower()


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-d+2un=*l5k-u*i1w4zov_edh*+oo^r=vy$clc1ysm&)l3d-^%*',
)


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

if not DEBUG and SECRET_KEY.startswith('django-insecure'):
    raise ValueError('Set DJANGO_SECRET_KEY for production')

ALLOWED_HOSTS = os.environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


INSTALLED_APPS = [
    'admin_2fa.admin_config.TwoFactorAdminConfig',
    'admin_2fa',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'core',
    'templates_api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'core.middleware.ApiKeyAuthMiddleware',
]

ROOT_URLCONF = 'emailBuilder.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'emailBuilder.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', 'django.db.backends.sqlite3'),
        'NAME': os.environ.get('DB_NAME', str(BASE_DIR / 'db.sqlite3')),
        'USER': os.environ.get('DB_USER', ''),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', ''),
        'PORT': os.environ.get('DB_PORT', ''),
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_LOGIN_METHODS = {'email', 'username'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'username*', 'password1*', 'password2*']

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
        'APP': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
            'key': '',
        },
    }
}


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}


CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
if not DEBUG:
    _cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]

_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True


AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_S3_REGION_NAME = os.environ.get('AWS_REGION', os.environ.get('AWS_S3_REGION_NAME', 'us-east-1'))
AWS_S3_ENDPOINT_URL = os.environ.get('AWS_ENDPOINT', '') or None
AWS_CLOUDFRONT_DOMAIN = os.environ.get('AWS_CLOUDFRONT_DOMAIN', '')
AWS_S3_KEY_PREFIX = os.environ.get('AWS_S3_KEY_PREFIX', 'emailBuilder')

# Bucket selection by DEBUG flag:
# - DEBUG=True  -> development bucket
# - DEBUG=False -> production bucket
# New preferred env vars:
# - AWS_BUCKET_NAME_DEV
# - AWS_BUCKET_NAME_PROD
# Backward-compatible fallbacks keep old variable names working.
AWS_BUCKET_NAME_DEV = os.environ.get(
    'AWS_BUCKET_NAME_DEV',
    os.environ.get('AWS_BUCKET_NAME_PUBLIC', ''),
)
AWS_BUCKET_NAME_PROD = os.environ.get(
    'AWS_BUCKET_NAME_PROD',
    os.environ.get('AWS_BUCKET_NAME_PUBLIC_PROD', AWS_BUCKET_NAME_DEV),
)
AWS_BUCKET_NAME_DEV_PRIVATE = os.environ.get(
    'AWS_BUCKET_NAME_DEV_PRIVATE',
    os.environ.get('AWS_BUCKET_NAME_PRIVATE', AWS_BUCKET_NAME_DEV),
)
AWS_BUCKET_NAME_PROD_PRIVATE = os.environ.get(
    'AWS_BUCKET_NAME_PROD_PRIVATE',
    os.environ.get('AWS_BUCKET_NAME_PRIVATE_PROD', AWS_BUCKET_NAME_PROD),
)

AWS_S3_PUBLIC_BUCKET = AWS_BUCKET_NAME_DEV if DEBUG else AWS_BUCKET_NAME_PROD
AWS_S3_PRIVATE_BUCKET = AWS_BUCKET_NAME_DEV_PRIVATE if DEBUG else AWS_BUCKET_NAME_PROD_PRIVATE
AWS_STORAGE_BUCKET_NAME = AWS_S3_PUBLIC_BUCKET


PLAN_LIMITS = {
    'free': {
        'monthly_price_usd': 0,
        'rendered_emails_limit': 1000,
        'storage_limit_bytes': 1 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 5 * 1024 * 1024,
        'max_media_files_per_upload': 5,
    },
    'starter': {
        'monthly_price_usd': 5,
        'rendered_emails_limit': 10000,
        'storage_limit_bytes': 5 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 25 * 1024 * 1024,
        'max_media_files_per_upload': 15,
    },
    'pro': {
        'monthly_price_usd': 20,
        'rendered_emails_limit': 50000,
        'storage_limit_bytes': 20 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 50 * 1024 * 1024,
        'max_media_files_per_upload': 40,
    },
    'enterprise': {
        'monthly_price_usd': 100,
        'rendered_emails_limit': 1000000,
        'storage_limit_bytes': 100 * 1024 * 1024 * 1024,
        'max_upload_size_bytes': 100 * 1024 * 1024,
        'max_media_files_per_upload': 120,
    },
}

MAX_UPLOAD_SIZE_FREE = PLAN_LIMITS['free']['max_upload_size_bytes']
MAX_UPLOAD_SIZE_PRO = PLAN_LIMITS['pro']['max_upload_size_bytes']
STORAGE_LIMIT_FREE = PLAN_LIMITS['free']['storage_limit_bytes']
STORAGE_LIMIT_PRO = PLAN_LIMITS['pro']['storage_limit_bytes']

ALLOWED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
PRESIGNED_URL_EXPIRY = 900

MAX_TEMPLATE_SIZE = 2 * 1024 * 1024


STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
STRIPE_SUCCESS_URL = os.environ.get('STRIPE_SUCCESS_URL', 'http://localhost/pricing?status=success')
STRIPE_CANCEL_URL = os.environ.get('STRIPE_CANCEL_URL', 'http://localhost/pricing?status=cancelled')


# --- Email ---
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
if RESEND_API_KEY:
    EMAIL_BACKEND = 'core.email_backend.ResendEmailBackend'
else:
    EMAIL_BACKEND = os.environ.get(
        'EMAIL_BACKEND',
        'django.core.mail.backends.console.EmailBackend',
    )
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ('true', '1')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@contentor.app')

# --- Admin 2FA ---
ADMIN_OTP_EXPIRY_SECONDS = 300  # 5 minutes
ADMIN_LOGIN_MAX_ATTEMPTS = 5
ADMIN_LOGIN_RATE_WINDOW_MINUTES = 15
