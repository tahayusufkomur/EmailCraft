import json
import re
from io import StringIO
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase

from core.models import Organization
from templates_api.export_engine import render_email_html
from templates_api.generation import validate_template
from templates_api.models import Template
from templates_api.services import provision_templates_for_org

GALLERY_DIR = Path(__file__).resolve().parent / 'templates'


def tpl(*blocks, **settings):
    return {'version': 1, 'settings': {'contentWidth': 600, 'defaultFont': 'Arial', 'defaultFontSize': 16,
                                       'defaultColor': '#222222', **settings},
            'header': {'blocks': []}, 'body': {'blocks': list(blocks)}, 'footer': {'blocks': []}}


def columns(ratio, gap, stack=True, cols=None):
    cols = cols or [{'id': f'c{i}', 'blocks': []} for i in range(len(ratio))]
    return {'id': 'cols', 'type': 'columns', 'data': {'columnCount': len(ratio), 'columnRatio': ratio, 'columns': cols},
            'style': {'gap': gap, 'stackOnMobile': stack}}


class TestColumnsExport(TestCase):
    def test_ratio_splits_space_left_after_gaps(self):
        html = render_email_html(tpl(columns([40, 60], 20)))['html']
        # content 232 / 348 plus the 10px half-gap each column keeps on its inner edge
        self.assertEqual(re.findall(r'max-width: (\d+)px; vertical-align', html), ['242', '358'])
        self.assertIn('padding: 0 10px 0 0px;', html)
        self.assertIn('padding: 0 0px 0 10px;', html)
        self.assertIn('.stack-gap-20 { padding: 20px 0 0 0 !important; }', html)

    def test_equal_ratios_give_equal_content_with_three_columns(self):
        html = render_email_html(tpl(columns([1, 1, 1], 18)))['html']
        widths = [int(w) for w in re.findall(r'max-width: (\d+)px; vertical-align', html)]
        gutters = [(9, 0), (9, 9), (0, 9)]  # (right, left) inner-edge padding per column
        self.assertEqual([w - r - l for w, (r, l) in zip(widths, gutters)], [188, 188, 188])

    def test_no_stack_is_a_table_row_that_never_wraps(self):
        html = render_email_html(tpl(columns([25, 75], 10, stack=False)))['html']
        self.assertNotIn('class="stack-column"', html)
        self.assertIn('width="24.5%"', html)
        self.assertIn('<td width="10" style="width: 10px;', html)

    def test_stacked_columns_share_the_widest_side_padding(self):
        cols = [{'id': 'a', 'blocks': [], 'padding': {'top': 0, 'right': 0, 'bottom': 0, 'left': 40}},
                {'id': 'b', 'blocks': [], 'padding': {'top': 0, 'right': 40, 'bottom': 0, 'left': 0}}]
        html = render_email_html(tpl(columns([50, 50], 24, cols=cols)))['html']
        self.assertEqual(html.count('class="stack-pad-40"'), 2)
        self.assertIn('.stack-pad-40 { padding-left: 40px !important; padding-right: 40px !important; }', html)


class TestTextExport(TestCase):
    def text(self, html, **style):
        return render_email_html(tpl({'id': 't', 'type': 'text', 'data': {'html': html, 'variables': []},
                                      'style': style}))['html']

    def test_paragraphs_and_links_get_email_styles(self):
        html = self.text('<p>One <a href="https://x">link</a></p><p style="text-align: center">Two</p>')
        self.assertIn('<p style="margin: 0 0 1em;">One', html)
        self.assertIn('<p style="margin: 0; text-align: center">Two', html)
        self.assertIn('<a href="https://x" style="color: #222222; text-decoration: underline;">', html)

    def test_existing_margins_and_link_styles_are_kept(self):
        html = self.text('<p style="margin:0 0 4px;">A</p><a href="#" style="color:red">b</a>')
        self.assertIn('<p style="margin:0 0 4px;">A', html)
        self.assertIn('<a href="#" style="color:red">', html)

    def test_block_font_size_colour_and_background(self):
        html = self.text('<p>Hi</p>', fontSize=13, color='#a3241b', backgroundColor='#ffeedd', lineHeight=1.5)
        self.assertIn('font-size: 13px;', html)
        self.assertIn('line-height: 19px; color: #a3241b;', html)
        self.assertIn('background-color: #ffeedd;', html)

    def test_fonts_named_inside_rich_text_are_linked(self):
        html = self.text('<p><span style="font-family: \'Bungee\', Impact">Hot</span></p>')
        self.assertIn('family=Bungee', html)


class TestBoxedBlocks(TestCase):
    def test_card_padding_is_applied_once_inside_the_box(self):
        card = {'id': 'c', 'type': 'card', 'data': {'heading': 'H', 'body': 'B'},
                'style': {'padding': {'top': 24, 'right': 24, 'bottom': 24, 'left': 24}}}
        html = render_email_html(tpl(card))['html']
        self.assertEqual(html.count('padding: 24px 24px 24px 24px'), 1)


class TestGalleryTemplates(TestCase):
    def entries(self):
        return [json.loads(p.read_text()) for p in sorted(GALLERY_DIR.rglob('*.json'))]

    def test_every_gallery_template_is_valid_editable_and_owned(self):
        entries = self.entries()
        self.assertEqual(len(entries), 15)
        self.assertEqual(len({e['name'] for e in entries}), 15)
        for e in entries:
            with self.subTest(e['name']):
                self.assertEqual(validate_template({'name': e['name'], 'template': e['template']}), [])
                # the editor canvas only shows body blocks
                self.assertEqual(e['template']['header']['blocks'], [])
                self.assertEqual(e['template']['footer']['blocks'], [])
                blob = json.dumps(e)
                for src in re.findall(r'"(?:src|imageSrc)": "([^"]+)"', blob):
                    self.assertTrue(src.startswith('https://mailcraft.contentor.app/gallery-assets/'), src)
                self.assertNotIn('"type": "social"', blob)  # SVG icons do not show in Gmail or Outlook
                # sample values only: variable keys are per organisation and the render API rejects missing ones
                self.assertNotIn('{{', blob)
                render_email_html(e['template'])

    def test_each_category_has_three_templates(self):
        counts = {}
        for e in self.entries():
            counts[e['category']] = counts.get(e['category'], 0) + 1
        self.assertEqual(counts, {c: 3 for c in ('welcome', 'newsletter', 'promotional', 'transactional', 'event')})


class TestSeedGalleryPrune(TestCase):
    def test_prune_retires_old_gallery_and_its_untouched_copies(self):
        untouched_org = Organization.objects.create(name='Untouched Org', email='untouched@example.com')
        editing_org = Organization.objects.create(name='Editing Org', email='editing@example.com')
        old = Template.objects.create(org=None, name='Retired Template', json_data={'version': 1},
                                      is_gallery=True, category='welcome')
        provision_templates_for_org(untouched_org)
        provision_templates_for_org(editing_org)
        edited = Template.objects.for_org(editing_org).get(source_template=old)
        edited.is_modified = True
        edited.save()

        call_command('seed_gallery', prune=True, stdout=StringIO())

        self.assertFalse(Template.objects.filter(pk=old.pk).exists())
        self.assertFalse(Template.objects.filter(org=untouched_org, name='Retired Template').exists())
        edited.refresh_from_db()
        self.assertIsNone(edited.source_template_id)
        self.assertEqual(Template.objects.shared().count(), 15)
