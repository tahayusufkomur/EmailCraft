from functools import wraps

from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response


def rate_limit_by_ip(endpoint_name, max_requests=5, window_seconds=60):
    """Decorator that rate-limits a DRF view by client IP."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = _get_client_ip(request)
            cache_key = f'rl:{endpoint_name}:{ip}'
            current = cache.get(cache_key, 0)
            if current >= max_requests:
                return Response(
                    {'error': {'code': 'RATE_LIMITED', 'message': 'Too many requests. Please try again later.'}},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            cache.set(cache_key, current + 1, timeout=window_seconds)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')
