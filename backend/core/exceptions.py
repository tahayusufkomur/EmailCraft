from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'error': {
                'code': _get_error_code(response.status_code),
                'message': _flatten_errors(response.data),
            }
        }
        response.data = error_data

    return response


def _get_error_code(status_code):
    codes = {
        400: 'VALIDATION_ERROR',
        401: 'INVALID_API_KEY',
        403: 'UNAUTHORIZED_ORIGIN',
        404: 'NOT_FOUND',
        413: 'FILE_TOO_LARGE',
        415: 'INVALID_FILE_TYPE',
        422: 'VALIDATION_ERROR',
        429: 'RATE_LIMIT_EXCEEDED',
    }
    return codes.get(status_code, 'INTERNAL_ERROR')


def _flatten_errors(data):
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return '; '.join(str(item) for item in data)
    if isinstance(data, dict):
        parts = []
        for key, value in data.items():
            if key == 'detail':
                return str(value)
            if isinstance(value, list):
                parts.append(f"{key}: {', '.join(str(v) for v in value)}")
            else:
                parts.append(f"{key}: {value}")
        return '; '.join(parts)
    return str(data)
