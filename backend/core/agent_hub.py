"""Thin client for the fleet's agent-container hub (runs prompts on Gemini CLI lanes)."""
import time

import requests
from django.conf import settings

REQUEST_TIMEOUT = 10
POLL_INTERVAL = 2
GRACE_S = 30


class HubError(Exception):
    pass


class HubHold(HubError):
    """Run is queued behind a hub-side hold (e.g. quota floor)."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _cancel(run_id: str) -> None:
    try:
        requests.post(f'{settings.AGENTC_HUB}/runs/{run_id}/cancel', timeout=REQUEST_TIMEOUT)
    except requests.RequestException:
        pass  # best effort; the caller is already failing


def run_prompt(prompt: str, *, label: str, timeout_s: int | None = None,
               priority: str = 'interactive') -> str:
    timeout_s = timeout_s or settings.AGENTC_TIMEOUT_S
    hub = settings.AGENTC_HUB
    body = {
        'prompt': prompt, 'cwd': settings.AGENTC_RUNS_DIR, 'model': settings.AGENTC_MODEL,
        'timeoutSec': timeout_s, 'worktree': False, 'requireSyncFresh': False,
        'priority': priority, 'label': label,
    }
    try:
        r = requests.post(f'{hub}/lanes/{settings.AGENTC_LANE}/runs', json=body, timeout=REQUEST_TIMEOUT)
        if not 200 <= r.status_code < 300:
            raise HubError(f'hub HTTP {r.status_code}: {r.text[:300]}')
        run = r.json()
        if run.get('state') == 'rejected':
            raise HubError(run.get('error') or 'hub rejected run')
        run_id = run['id']
        deadline = time.monotonic() + timeout_s + GRACE_S
        while time.monotonic() < deadline:
            run = requests.get(f'{hub}/runs/{run_id}', timeout=REQUEST_TIMEOUT).json()
            state = run.get('state')
            if state == 'succeeded':
                return run.get('resultText') or ''
            if state == 'queued' and run.get('waitReason'):
                _cancel(run_id)
                raise HubHold(run['waitReason'])
            if state not in ('queued', 'running'):
                raise HubError(run.get('error') or (run.get('resultText') or '')[:300] or f'hub run {state}')
            time.sleep(POLL_INTERVAL)
    except requests.RequestException as e:
        raise HubError(str(e)) from e
    _cancel(run_id)
    raise HubError('hub run timed out')
