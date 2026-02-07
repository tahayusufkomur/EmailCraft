import secrets
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import ApiKey
from core.serializers import SessionRequestSerializer


@api_view(['POST'])
def create_session(request):
    """
    POST /api/v1/auth/session
    Validates API key + origin, returns a session token and config.
    """
    serializer = SessionRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    api_key_raw = request.META.get('HTTP_X_API_KEY', '')
    origin = serializer.validated_data['origin']

    if not api_key_raw:
        return Response(
            {'error': {'code': 'INVALID_API_KEY', 'message': 'API key is required.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    key_hash = ApiKey.hash_key(api_key_raw)
    try:
        api_key = ApiKey.objects.select_related('org').get(
            key_hash=key_hash,
            is_active=True,
            revoked_at__isnull=True,
        )
    except ApiKey.DoesNotExist:
        return Response(
            {'error': {'code': 'INVALID_API_KEY', 'message': 'Invalid or revoked API key.'}},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    org = api_key.org

    # Origin validation for live keys
    if api_key.environment == 'live' and org.allowed_origins:
        if origin not in org.allowed_origins:
            return Response(
                {'error': {'code': 'UNAUTHORIZED_ORIGIN', 'message': f'Origin {origin} is not allowed.'}},
                status=status.HTTP_403_FORBIDDEN,
            )

    # Generate session token
    session_token = f"sess_{secrets.token_hex(32)}"
    expires_at = timezone.now() + timedelta(hours=4)

    from django.conf import settings
    max_upload = settings.MAX_UPLOAD_SIZE_PRO if org.is_pro else settings.MAX_UPLOAD_SIZE_FREE

    return Response({
        'token': session_token,
        'expires_at': expires_at.isoformat(),
        'config': {
            'plan': org.plan,
            'max_upload_size_bytes': max_upload,
            'storage_used_bytes': org.storage_used_bytes,
            'storage_limit_bytes': org.storage_limit_bytes,
        },
    })
