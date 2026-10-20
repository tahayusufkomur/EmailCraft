"""Thin client for the pix4less REST API (image search, download, AI generation)."""
import time

import requests
from django.conf import settings

REQUEST_TIMEOUT = 10
LONG_POLL_S = 25
LONG_POLL_TIMEOUT = LONG_POLL_S + 5


class Pix4LessError(Exception):
    pass


def _call(method, path: str, *, timeout: int = REQUEST_TIMEOUT, headers: dict | None = None, **kwargs) -> dict:
    """method is requests.post / requests.get; returns the response's `data` payload."""
    if not settings.PIX4LESS_API_KEY:
        raise Pix4LessError('pix4less api key not configured')
    headers = {'X-API-Key': settings.PIX4LESS_API_KEY, **(headers or {})}
    try:
        r = method(f'{settings.PIX4LESS_API_URL}{path}', headers=headers, timeout=timeout, **kwargs)
        if r.status_code == 402:
            raise Pix4LessError('payment_required')
        if not 200 <= r.status_code < 300:
            raise Pix4LessError(f'pix4less HTTP {r.status_code}: {r.text[:300]}')
        return r.json()['data']
    except requests.RequestException as e:
        raise Pix4LessError(str(e)) from e


def search(query: str, aspect_ratio: str) -> dict | None:
    body = {'query': query, 'aspect_ratio': aspect_ratio, 'per_page': 1,
            'search_type': 'fast', 'safe_search': True}
    hits = _call(requests.post, '/v1/images/search', json=body)
    return hits[0] if hits else None


def download_url(image_id: str) -> str:
    return _call(requests.post, f'/v1/images/{image_id}/download')['url']


def generate(prompt: str, aspect_ratio: str, idempotency_key: str, timeout_s: int = 120) -> str:
    deadline = time.monotonic() + timeout_s
    data = _call(requests.post, '/v1/images/generate', headers={'Idempotency-Key': idempotency_key},
                 json={'query': prompt, 'aspect_ratio': aspect_ratio, 'resolution': '1K'})
    gen_id = data['id']
    while True:
        status = data.get('status')
        if status == 'fulfilled':
            return data['image_id']
        if status in ('failed', 'rejected'):
            raise Pix4LessError(data.get('error') or status)
        if time.monotonic() >= deadline:
            raise Pix4LessError('generation timed out')
        # long-poll: the server holds the request up to LONG_POLL_S, so no client-side sleep
        data = _call(requests.get, f'/v1/generation-requests/{gen_id}',
                     params={'wait': LONG_POLL_S}, timeout=LONG_POLL_TIMEOUT)
