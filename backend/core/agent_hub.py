"""Thin client for the fleet's agent-container hub (runs prompts on Gemini CLI lanes)."""
import json
import time

import requests
from django.conf import settings

REQUEST_TIMEOUT = 10
POLL_INTERVAL = 2
GRACE_S = 30
STREAM_READ_TIMEOUT = 60  # the hub writes a keep-alive newline every 15 s


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
               priority: str = 'interactive', model: str | None = None, on_text=None) -> str:
    """Run one prompt on the lane and return its resultText.

    Text deltas reach `on_text` as the model writes them. The prompt carries customer text, so a run
    whose event log shows a tool call fails; any run this call gives up on is cancelled on the hub.
    """
    timeout_s = timeout_s or settings.AGENTC_TIMEOUT_S
    hub = settings.AGENTC_HUB
    body = {
        'prompt': prompt, 'cwd': settings.AGENTC_RUNS_DIR, 'model': model or settings.AGENTC_MODEL,
        'timeoutSec': timeout_s, 'worktree': False, 'requireSyncFresh': False,
        'priority': priority, 'label': label,
    }
    run_id, finished = None, False
    try:
        r = requests.post(f'{hub}/lanes/{settings.AGENTC_LANE}/runs', json=body, timeout=REQUEST_TIMEOUT)
        if not 200 <= r.status_code < 300:
            raise HubError(f'hub HTTP {r.status_code}: {r.text[:300]}')
        run = r.json()
        if run.get('state') == 'rejected':
            raise HubError(run.get('error') or 'hub rejected run')
        run_id = run['id']
        deadline = time.monotonic() + timeout_s + GRACE_S
        while run.get('state') == 'queued':
            if run.get('waitReason'):
                raise HubHold(run['waitReason'])
            if time.monotonic() > deadline:
                raise HubError('hub run timed out')
            time.sleep(POLL_INTERVAL)
            run = requests.get(f'{hub}/runs/{run_id}', timeout=REQUEST_TIMEOUT).json()
        # NDJSON event log; the hub closes the stream once the run is terminal.
        with requests.get(f'{hub}/runs/{run_id}/events', params={'since': 0}, stream=True,
                          timeout=(REQUEST_TIMEOUT, STREAM_READ_TIMEOUT)) as events:
            events.raise_for_status()
            for line in events.iter_lines():
                if time.monotonic() > deadline:
                    raise HubError('hub run timed out')
                if not line.strip():
                    continue
                event = json.loads(line)
                if event.get('type') == 'tool':
                    raise HubError('agent used a tool')
                if event.get('type') == 'text' and on_text:
                    on_text(event.get('text') or '')
        run = requests.get(f'{hub}/runs/{run_id}', timeout=REQUEST_TIMEOUT).json()
        state = run.get('state')
        finished = state not in ('queued', 'running')
        if state == 'succeeded':
            return run.get('resultText') or ''
        raise HubError(run.get('error') or (run.get('resultText') or '')[:300] or f'hub run {state}')
    except (requests.RequestException, ValueError) as e:
        raise HubError(str(e)) from e
    finally:
        if run_id is not None and not finished:
            _cancel(run_id)
