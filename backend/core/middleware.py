import re

from django.http import JsonResponse
from django.utils import timezone

from core.models import ApiKey

# Paths that don't require API key authentication
PUBLIC_PATHS = [
    '/admin/',
    '/api/v1/auth/session',
]

# Paths that are internal Django paths
INTERNAL_PATHS = [
    '/static/',
    '/favicon.ico',
]


class ApiKeyAuthMiddleware:
    """
    Authenticates requests via X-API-Key header.
    Attaches org and api_key to the request object.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Skip auth for internal/public paths
        if self._is_exempt(path):
            return self.get_response(request)

        # Only enforce on API paths
        if not path.startswith('/api/'):
            return self.get_response(request)

        api_key_raw = request.META.get('HTTP_X_API_KEY', '')

        if not api_key_raw:
            return JsonResponse(
                {'error': {'code': 'INVALID_API_KEY', 'message': 'API key is required.'}},
                status=401,
            )

        # Validate key format
        if not re.match(r'^mc_(live|test)_[a-f0-9]{32}$', api_key_raw):
            return JsonResponse(
                {'error': {'code': 'INVALID_API_KEY', 'message': 'Invalid API key format.'}},
                status=401,
            )

        key_hash = ApiKey.hash_key(api_key_raw)
        try:
            api_key = ApiKey.objects.select_related('org').get(
                key_hash=key_hash,
                is_active=True,
                revoked_at__isnull=True,
            )
        except ApiKey.DoesNotExist:
            return JsonResponse(
                {'error': {'code': 'INVALID_API_KEY', 'message': 'Invalid or revoked API key.'}},
                status=401,
            )

        if not api_key.org.is_active:
            return JsonResponse(
                {'error': {'code': 'INVALID_API_KEY', 'message': 'Organization is deactivated.'}},
                status=401,
            )

        # Origin validation for live keys
        if api_key.environment == 'live':
            origin = request.META.get('HTTP_ORIGIN', '')
            if origin and api_key.org.allowed_origins:
                if origin not in api_key.org.allowed_origins:
                    return JsonResponse(
                        {'error': {'code': 'UNAUTHORIZED_ORIGIN', 'message': f'Origin {origin} is not allowed.'}},
                        status=403,
                    )

        # Attach to request
        request.org = api_key.org
        request.api_key = api_key

        # Update last used
        ApiKey.objects.filter(pk=api_key.pk).update(last_used_at=timezone.now())

        return self.get_response(request)

    def _is_exempt(self, path):
        for public_path in PUBLIC_PATHS:
            if path.startswith(public_path):
                return True
        for internal_path in INTERNAL_PATHS:
            if path.startswith(internal_path):
                return True
        return False
