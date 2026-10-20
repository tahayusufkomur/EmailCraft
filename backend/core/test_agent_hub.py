from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase, override_settings

from core.agent_hub import HubError, HubHold, run_prompt


def resp(data, status=200):
    return MagicMock(status_code=status, json=lambda: data, text=str(data))


@override_settings(AGENTC_HUB='http://hub', AGENTC_LANE='mailcraft', AGENTC_MODEL='m',
                   AGENTC_RUNS_DIR='/runs', AGENTC_TIMEOUT_S=10)
@patch('core.agent_hub.time.sleep')
class TestRunPrompt(SimpleTestCase):
    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_posts_to_lane_and_returns_result_text(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.return_value = resp({'state': 'succeeded', 'resultText': '{"a":1}'})
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

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_null_result_text_returns_empty_string(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.return_value = resp({'state': 'succeeded', 'resultText': None})
        self.assertEqual(run_prompt('p', label='t'), '')

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_queued_with_wait_reason_cancels_and_raises_hold(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'queued'})
        get.return_value = resp({'state': 'queued', 'waitReason': 'quota floor'})
        with self.assertRaises(HubHold) as cm:
            run_prompt('p', label='t')
        self.assertEqual(cm.exception.reason, 'quota floor')
        self.assertIn('/runs/r1/cancel', post.call_args_list[-1].args[0])

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_queued_without_wait_reason_keeps_polling(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'queued'})
        get.side_effect = [resp({'state': 'queued'}), resp({'state': 'succeeded', 'resultText': 'ok'})]
        self.assertEqual(run_prompt('p', label='t'), 'ok')
        sleep.assert_called_with(2)

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_failed_state_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.return_value = resp({'state': 'failed', 'error': 'boom'})
        with self.assertRaisesMessage(HubError, 'boom'):
            run_prompt('p', label='t')

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_failed_state_without_error_uses_result_text(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.return_value = resp({'state': 'cancelled', 'resultText': 'partial'})
        with self.assertRaisesMessage(HubError, 'partial'):
            run_prompt('p', label='t')

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_rejected_on_submit_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'rejected', 'error': 'no account'})
        with self.assertRaisesMessage(HubError, 'no account'):
            run_prompt('p', label='t')
        get.assert_not_called()

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_non_2xx_on_submit_raises_hub_error(self, post, get, sleep):
        post.return_value = resp({}, status=500)
        with self.assertRaisesMessage(HubError, 'hub HTTP 500'):
            run_prompt('p', label='t')

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_request_exception_raises_hub_error(self, post, get, sleep):
        import requests
        post.side_effect = requests.ConnectionError('down')
        with self.assertRaisesMessage(HubError, 'down'):
            run_prompt('p', label='t')

    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_poll_network_error_cancels_run(self, post, get, sleep):
        import requests
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.side_effect = requests.ConnectionError('down')
        with self.assertRaises(HubError):
            run_prompt('p', label='t')
        self.assertIn('/runs/r1/cancel', post.call_args_list[-1].args[0])

    @patch('core.agent_hub.time.monotonic')
    @patch('core.agent_hub.requests.get')
    @patch('core.agent_hub.requests.post')
    def test_deadline_cancels_and_raises_timeout(self, post, get, mono, sleep):
        post.return_value = resp({'id': 'r1', 'state': 'running'})
        get.return_value = resp({'state': 'running'})
        mono.side_effect = [0, 0, 100]  # start, first loop check, past 10+30
        with self.assertRaisesMessage(HubError, 'hub run timed out'):
            run_prompt('p', label='t')
        self.assertIn('/runs/r1/cancel', post.call_args_list[-1].args[0])
