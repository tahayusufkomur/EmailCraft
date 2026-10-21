from unittest.mock import MagicMock, patch

import requests
from django.test import SimpleTestCase, override_settings

from core.pix4less import Pix4LessError, download_url, generate, search


def resp(data, status=200):
    return MagicMock(status_code=status, json=lambda: data, text=str(data))


@override_settings(PIX4LESS_API_URL='https://px', PIX4LESS_API_KEY='k')
@patch('core.pix4less.requests.get')
@patch('core.pix4less.requests.post')
class TestPix4Less(SimpleTestCase):
    def test_search_sends_api_key_and_returns_first_hit(self, post, get):
        post.return_value = resp({'data': [{'id': 'i1', 'description': 'd', 'match_confidence': 0.9}]})
        self.assertEqual(search('canoe', '16:9')['id'], 'i1')
        self.assertEqual(post.call_args.args[0], 'https://px/v1/images/search')
        self.assertEqual(post.call_args.kwargs['headers']['X-API-Key'], 'k')
        body = post.call_args.kwargs['json']
        self.assertEqual(body['aspect_ratio'], '16:9')
        self.assertEqual(body['query'], 'canoe')
        self.assertEqual(body['per_page'], 1)
        self.assertEqual(body['search_type'], 'fast')
        self.assertIs(body['safe_search'], True)
        self.assertEqual(post.call_count, 1)  # a confident hit needs no near-aspect search

    def test_search_empty_returns_none(self, post, get):
        post.return_value = resp({'data': []})
        self.assertIsNone(search('canoe', '16:9'))

    def test_search_weak_hit_gives_way_to_a_clearly_better_one_of_the_same_orientation(self, post, get):
        # A 4:3 search for a group yoga class once returned only a wheelchair dance photo (0.47);
        # 3:2 had a 0.90 match.
        post.side_effect = [resp({'data': [{'id': 'weak', 'match_confidence': 0.47}]}),
                            resp({'data': [{'id': 'good', 'match_confidence': 0.9}]})]
        self.assertEqual(search('group yoga class', '4:3')['id'], 'good')
        wider = post.call_args_list[1].kwargs['json']
        self.assertEqual(wider['filters'], {'orientation': 'landscape'})
        self.assertNotIn('aspect_ratio', wider)

    def test_search_keeps_a_weak_hit_that_is_not_clearly_beaten(self, post, get):
        post.side_effect = [resp({'data': [{'id': 'asked', 'match_confidence': 0.49}]}),
                            resp({'data': [{'id': 'wider', 'match_confidence': 0.52}]})]
        self.assertEqual(search('singing bowls', '4:3')['id'], 'asked')

    def test_search_without_hits_in_the_asked_aspect_takes_the_same_orientation(self, post, get):
        # Tree-pose photos existed only in 16:9 when the model asked for 4:3.
        post.side_effect = [resp({'data': []}),
                            resp({'data': [{'id': 'tree', 'match_confidence': 0.925}]})]
        self.assertEqual(search('tree pose outdoors', '4:3')['id'], 'tree')

    def test_download_url(self, post, get):
        post.return_value = resp({'data': {'url': 'https://signed'}})
        self.assertEqual(download_url('i1'), 'https://signed')
        self.assertEqual(post.call_args.args[0], 'https://px/v1/images/i1/download')

    def test_generate_polls_until_fulfilled(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'pending'}}, status=202)
        get.side_effect = [resp({'data': {'id': 'g1', 'status': 'processing'}}, 202),
                           resp({'data': {'id': 'g1', 'status': 'fulfilled', 'image_id': 'i9'}})]
        self.assertEqual(generate('a canoe', '16:9', 'idem-1'), 'i9')
        self.assertEqual(post.call_args.args[0], 'https://px/v1/images/generate')
        self.assertEqual(post.call_args.kwargs['headers']['Idempotency-Key'], 'idem-1')
        self.assertEqual(post.call_args.kwargs['json'],
                         {'query': 'a canoe', 'aspect_ratio': '16:9', 'resolution': '1K'})
        self.assertEqual(get.call_args.args[0], 'https://px/v1/generation-requests/g1')
        self.assertEqual(get.call_args.kwargs['params'], {'wait': 25})
        self.assertEqual(get.call_args.kwargs['timeout'], 30)

    def test_generate_immediately_fulfilled_skips_polling(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'fulfilled', 'image_id': 'i2'}})
        self.assertEqual(generate('p', '1:1', 'k1'), 'i2')
        get.assert_not_called()

    def test_generate_failed_raises(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'pending'}}, 202)
        get.return_value = resp({'data': {'id': 'g1', 'status': 'failed', 'error': 'bad prompt'}})
        with self.assertRaisesMessage(Pix4LessError, 'bad prompt'):
            generate('p', '1:1', 'k1')

    def test_generate_rejected_without_error_uses_status(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'rejected'}})
        with self.assertRaisesMessage(Pix4LessError, 'rejected'):
            generate('p', '1:1', 'k1')

    @patch('core.pix4less.time.monotonic')
    def test_generate_times_out(self, mono, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'pending'}}, 202)
        get.return_value = resp({'data': {'id': 'g1', 'status': 'processing'}}, 202)
        mono.side_effect = [0, 1, 200]  # start, first loop check, past 120
        with self.assertRaisesMessage(Pix4LessError, 'generation timed out'):
            generate('p', '1:1', 'k1')

    def test_generate_fulfilled_without_image_id_raises(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'fulfilled', 'image_id': None}})
        with self.assertRaisesMessage(Pix4LessError, 'without image_id'):
            generate('p', '1:1', 'k1')

    def test_search_response_without_data_raises(self, post, get):
        post.return_value = resp({'meta': {}})
        with self.assertRaisesMessage(Pix4LessError, 'malformed'):
            search('canoe', '16:9')

    def test_search_non_list_data_raises(self, post, get):
        post.return_value = resp({'data': {'x': 1}})
        with self.assertRaises(Pix4LessError):
            search('canoe', '16:9')

    def test_download_response_with_null_data_raises(self, post, get):
        post.return_value = resp({'data': None})
        with self.assertRaisesMessage(Pix4LessError, 'malformed'):
            download_url('i1')

    def test_download_response_without_url_raises(self, post, get):
        post.return_value = resp({'data': {}})
        with self.assertRaisesMessage(Pix4LessError, 'malformed'):
            download_url('i1')

    def test_generate_response_without_id_raises(self, post, get):
        post.return_value = resp({'data': {'status': 'pending'}})
        with self.assertRaisesMessage(Pix4LessError, 'malformed'):
            generate('p', '1:1', 'k1')

    def test_non_json_body_raises(self, post, get):
        r = resp({})
        r.json = MagicMock(side_effect=ValueError('not json'))
        post.return_value = r
        with self.assertRaises(Pix4LessError):
            search('canoe', '16:9')

    def test_402_raises_payment_required(self, post, get):
        post.return_value = resp({'error': 'no credits'}, status=402)
        with self.assertRaisesMessage(Pix4LessError, 'payment_required'):
            search('canoe', '16:9')

    def test_402_on_poll_raises_payment_required(self, post, get):
        post.return_value = resp({'data': {'id': 'g1', 'status': 'pending'}}, 202)
        get.return_value = resp({}, status=402)
        with self.assertRaisesMessage(Pix4LessError, 'payment_required'):
            generate('p', '1:1', 'k1')

    def test_non_2xx_raises_with_status(self, post, get):
        post.return_value = resp({}, status=500)
        with self.assertRaisesMessage(Pix4LessError, 'pix4less HTTP 500'):
            download_url('i1')

    def test_request_exception_raises(self, post, get):
        post.side_effect = requests.ConnectionError('down')
        with self.assertRaisesMessage(Pix4LessError, 'down'):
            search('canoe', '16:9')

    @override_settings(PIX4LESS_API_KEY='')
    def test_empty_key_raises_without_request(self, post, get):
        with self.assertRaisesMessage(Pix4LessError, 'api key not configured'):
            search('canoe', '16:9')
        post.assert_not_called()
        get.assert_not_called()
