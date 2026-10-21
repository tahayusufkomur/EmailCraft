import json
from unittest.mock import MagicMock, patch

import requests
from django.test import SimpleTestCase, override_settings

from core.agent_hub import HubError, HubHold, run_prompt


def resp(data, status=200):
    return MagicMock(status_code=status, json=lambda: data, text=str(data))


def stream(*events, lines=None):
    """A streamed /events response yielding NDJSON lines."""
    m = MagicMock()
    m.__enter__.return_value = m
    m.iter_lines.return_value = lines if lines is not None else [json.dumps(e).encode() for e in events]
    return m


def hub_get(*runs, events=None):
    """requests.get stand-in: /events returns the stream, every other GET the next run JSON."""
    runs = iter(runs)

    def get(url, **kwargs):
        if url.endswith('/events'):
            return events if events is not None else stream()
        return resp(next(runs))
    return get


@override_settings(AGENTC_HUB='http://hub', AGENTC_LANE='mailcraft', AGENTC_MODEL='m',
                   AGENTC_RUNS_DIR='/runs', AGENTC_TIMEOUT_S=10)
@patch('core.agent_hub.time.sleep')
@patch('core.agent_hub.requests.get')
@patch('core.agent_hub.requests.post')
class TestRunPrompt(SimpleTestCase):
    def _cancelled(self, post):
        return any('/runs/r1/cancel' in c.args[0] for c in post.call_args_list)

    def test_posts_to_lane_and_returns_result_text(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get({'state': 'succeeded', 'resultText': '{"a":1}'})
        self.assertEqual(run_prompt('p', label='t'), '{"a":1}')
        self.assertEqual(post.call_args.args[0], 'http://hub/lanes/mailcraft/runs')
        body = post.call_args.kwargs['json']
        self.assertEqual(body['prompt'], 'p')
        self.assertEqual(body['cwd'], '/runs')
        self.assertEqual(body['model'], 'm')
        self.assertEqual(body['timeoutSec'], 10)
        self.assertEqual(body['priority'], 'interactive')
        self.assertEqual(body['label'], 't')
        self.assertIs(body['worktree'], False)
        self.assertIs(body['requireSyncFresh'], False)
        events_call = get.call_args_list[0]
        self.assertEqual(events_call.args[0], 'http://hub/runs/r1/events')
        self.assertEqual((events_call.kwargs['params'], events_call.kwargs['stream']), ({'since': 0}, True))
        self.assertFalse(self._cancelled(post))

    def test_model_override(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get({'state': 'succeeded', 'resultText': 'ok'})
        run_prompt('p', label='t', model='fast')
        self.assertEqual(post.call_args.kwargs['json']['model'], 'fast')

    def test_streams_text_deltas_to_callback(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        events = stream({'type': 'status', 'text': 'session started'}, {'type': 'text', 'text': 'ab'},
                        {'type': 'text', 'text': 'cd'}, {'type': 'hub', 'text': 'succeeded'})
        get.side_effect = hub_get({'state': 'succeeded', 'resultText': 'abcd'}, events=events)
        seen = []
        self.assertEqual(run_prompt('p', label='t', on_text=seen.append), 'abcd')
        self.assertEqual(seen, ['ab', 'cd'])

    def test_tool_event_fails_and_cancels(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        events = stream({'type': 'text', 'text': '{'}, {'type': 'tool', 'text': 'run_shell_command'})
        get.side_effect = hub_get(events=events)
        with self.assertRaisesMessage(HubError, 'agent used a tool'):
            run_prompt('p', label='t')
        self.assertTrue(self._cancelled(post))

    def test_unreadable_event_fails_closed(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get(events=stream(lines=[b'', b'not json']))
        with self.assertRaises(HubError):
            run_prompt('p', label='t')
        self.assertTrue(self._cancelled(post))

    def test_null_result_text_returns_empty_string(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get({'state': 'succeeded', 'resultText': None})
        self.assertEqual(run_prompt('p', label='t'), '')

    def test_queued_with_wait_reason_cancels_and_raises_hold(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'queued'})
        get.side_effect = hub_get({'state': 'queued', 'waitReason': 'quota floor'})
        with self.assertRaises(HubHold) as cm:
            run_prompt('p', label='t')
        self.assertEqual(cm.exception.reason, 'quota floor')
        self.assertIn('/runs/r1/cancel', post.call_args_list[-1].args[0])

    def test_queued_without_wait_reason_keeps_polling(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'queued'})
        get.side_effect = hub_get({'state': 'queued'}, {'state': 'running'},
                                  {'state': 'succeeded', 'resultText': 'ok'})
        self.assertEqual(run_prompt('p', label='t'), 'ok')
        sleep.assert_called_with(2)

    def test_failed_state_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get({'state': 'failed', 'error': 'boom'})
        with self.assertRaisesMessage(HubError, 'boom'):
            run_prompt('p', label='t')
        self.assertFalse(self._cancelled(post))

    def test_failed_state_without_error_uses_result_text(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get({'state': 'cancelled', 'resultText': 'partial'})
        with self.assertRaisesMessage(HubError, 'partial'):
            run_prompt('p', label='t')

    def test_rejected_on_submit_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'rejected', 'error': 'no account'})
        with self.assertRaisesMessage(HubError, 'no account'):
            run_prompt('p', label='t')
        get.assert_not_called()

    def test_non_2xx_on_submit_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({}, status=500)
        with self.assertRaisesMessage(HubError, 'hub HTTP 500'):
            run_prompt('p', label='t')

    def test_request_exception_raises_hub_error(self, post, get, sleep):
        post.side_effect = requests.ConnectionError('down')
        with self.assertRaisesMessage(HubError, 'down'):
            run_prompt('p', label='t')

    def test_stream_network_error_cancels_run(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = requests.ConnectionError('down')
        with self.assertRaises(HubError):
            run_prompt('p', label='t')
        self.assertTrue(self._cancelled(post))

    def test_callback_error_still_cancels_run(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get(events=stream({'type': 'text', 'text': 'x'}))

        def boom(_text):
            raise RuntimeError('preview broke')
        with self.assertRaises(RuntimeError):
            run_prompt('p', label='t', on_text=boom)
        self.assertTrue(self._cancelled(post))

    @patch('core.agent_hub.time.monotonic')
    def test_deadline_cancels_and_raises_timeout(self, mono, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = hub_get(events=stream({'type': 'text', 'text': 'x'}))
        mono.side_effect = [0, 100]  # start, then past 10+30 at the first event
        with self.assertRaisesMessage(HubError, 'hub run timed out'):
            run_prompt('p', label='t')
        self.assertIn('/runs/r1/cancel', post.call_args_list[-1].args[0])
