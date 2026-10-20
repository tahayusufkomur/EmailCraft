from django.test import TestCase
from templates_api import export_engine

def render_email_html(template):
    return export_engine.render_email_html(template)['html']

def tpl(block):
    return {'version': 1, 'settings': {'backgroundColor': '#fff', 'contentWidth': 600,
            'defaultFont': 'Arial', 'defaultFontSize': 14, 'defaultColor': '#333'},
            'header': {'blocks': []}, 'body': {'blocks': [block]}, 'footer': {'blocks': []}}

class TestFrameStyles(TestCase):
    def test_background_image_wraps_block_with_vml(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'text', 'data': {'html': 'hi', 'variables': []},
            'style': {'backgroundImage': 'https://x/i.jpg', 'backgroundOverlay': '#000000', 'backgroundOverlayOpacity': 0.5}}))
        self.assertIn('background="https://x/i.jpg"', html)
        self.assertIn('<v:fill type="tile" src="https://x/i.jpg"', html)
        self.assertIn('rgba(0, 0, 0, 0.5)', html)

    def test_null_overlay_opacity_defaults(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'text', 'data': {'html': 'hi', 'variables': []},
            'style': {'backgroundImage': 'https://x/i.jpg', 'backgroundOverlay': '#000000', 'backgroundOverlayOpacity': None}}))
        self.assertIn('rgba(0, 0, 0, 0.4)', html)

    def test_gradient_renders_on_server(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'heading', 'data': {'text': 'T', 'level': 2},
            'style': {'backgroundGradient': 'linear-gradient(90deg, #000, #fff)'}}))
        self.assertIn('background: linear-gradient(90deg, #000, #fff)', html)

    def test_border_and_radius(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'text', 'data': {'html': 'hi', 'variables': []},
            'style': {'borderWidth': 2, 'borderColor': '#ff0000', 'borderStyle': 'dashed', 'borderRadius': 12}}))
        self.assertIn('border: 2px dashed #ff0000', html)
        self.assertIn('border-radius: 12px', html)

    def test_no_frame_keys_leaves_output_unchanged(self):
        block = {'id': 'a', 'type': 'text', 'data': {'html': 'hi', 'variables': []}, 'style': {}}
        self.assertNotIn('<v:rect', render_email_html(tpl(block)))

    def test_line_height_multiplier(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'heading', 'data': {'text': 'T', 'level': 2},
            'style': {'fontSize': 20, 'lineHeight': 1.5}}))
        self.assertIn('line-height: 30px', html)

    def test_single_column_section_with_min_height_and_valign(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'columns',
            'data': {'columnCount': 1, 'columnRatio': [100], 'columns': [{'id': 'c', 'blocks': [], 'padding': {'top': 8, 'right': 8, 'bottom': 8, 'left': 8}, 'borderRadius': 10}]},
            'style': {'gap': 0, 'stackOnMobile': True, 'minHeight': 320, 'verticalAlignment': 'center'}}))
        self.assertIn('height: 320px', html)
        self.assertIn('valign="middle"', html)
        self.assertIn('padding: 8px 8px 8px 8px', html)
        self.assertIn('border-radius: 10px', html)

    def test_button_border_not_duplicated_by_frame(self):
        html = render_email_html(tpl({'id': 'a', 'type': 'button', 'data': {'text': 'Go', 'url': 'https://x'},
            'style': {'borderWidth': 2, 'borderColor': '#ff0000', 'borderStyle': 'solid'}}))
        # the button renderer itself emits the border on its <td> and its <a>; the frame must add none
        self.assertEqual(html.count('border: 2px solid #ff0000'), 2)

    def test_image_radius_gets_no_frame_wrapper(self):
        base = render_email_html(tpl({'id': 'a', 'type': 'image', 'data': {'src': 'https://x/i.jpg', 'alt': ''}, 'style': {}}))
        html = render_email_html(tpl({'id': 'a', 'type': 'image', 'data': {'src': 'https://x/i.jpg', 'alt': ''},
            'style': {'borderRadius': 8}}))
        self.assertNotIn('<v:rect', html)
        self.assertIn('border-radius: 8px', html)
        self.assertEqual(html.count('<table'), base.count('<table'))
