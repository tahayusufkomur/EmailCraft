"""
Email HTML Export Engine.
Converts template JSON to email-compatible HTML following strict email client rules:
- Table-based layout
- Inline CSS only
- VML fallbacks for Outlook
- Max 600px width
- Web-safe fonts
"""

import copy
import html as html_module
import re

BACKGROUND_STYLE_PRESETS = {
    'aurora': {
        'fallback_color': '#e7ecff',
        'background': (
            'radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.22), transparent 45%), '
            'radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.22), transparent 42%), '
            'linear-gradient(135deg, #f6f7ff 0%, #e0e7ff 45%, #dbeafe 100%)'
        ),
    },
    'sunset-glow': {
        'fallback_color': '#fdf1e8',
        'background': (
            'radial-gradient(circle at 78% 18%, rgba(251, 113, 133, 0.22), transparent 42%), '
            'radial-gradient(circle at 22% 78%, rgba(251, 191, 36, 0.2), transparent 48%), '
            'linear-gradient(145deg, #fff7ed 0%, #fee2e2 48%, #ffedd5 100%)'
        ),
    },
    'mint-weave': {
        'fallback_color': '#eafbf6',
        'background': (
            'repeating-linear-gradient(45deg, rgba(15, 118, 110, 0.05) 0, rgba(15, 118, 110, 0.05) 1px, transparent 1px, transparent 18px), '
            'repeating-linear-gradient(-45deg, rgba(20, 184, 166, 0.05) 0, rgba(20, 184, 166, 0.05) 1px, transparent 1px, transparent 18px), '
            'linear-gradient(135deg, #f0fdfa 0%, #dcfce7 100%)'
        ),
    },
    'midnight-grid': {
        'fallback_color': '#0f172a',
        'background': (
            'linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), '
            'linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px), '
            'radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 36%), '
            'radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.16), transparent 34%), '
            'linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)'
        ),
    },
    'paper-rings': {
        'fallback_color': '#f8f6f1',
        'background': (
            'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0.08) 1px, transparent 1px), '
            'radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.12) 0, rgba(148, 163, 184, 0.12) 2px, transparent 2px), '
            'radial-gradient(circle at 30% 80%, rgba(148, 163, 184, 0.1) 0, rgba(148, 163, 184, 0.1) 2px, transparent 2px), '
            'linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)'
        ),
    },
}

CSS_COLOR_PATTERN = re.compile(r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$')


# ---------------------------------------------------------------------------
# Variable handling
# ---------------------------------------------------------------------------

_VAR_PATTERN = re.compile(r'\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}')
_VALID_KEY_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')


def validate_variable_key(key):
    """Check that a variable key contains only letters, digits, and underscores."""
    return bool(_VALID_KEY_PATTERN.match(key))


def extract_variable_keys(json_data):
    """Scan all blocks and return set of variable keys used in the template."""
    keys = set()
    for section_name in ('header', 'body', 'footer'):
        blocks = json_data.get(section_name, {}).get('blocks', [])
        _extract_keys_from_blocks(blocks, keys)
    return keys


def _extract_keys_from_blocks(blocks, keys):
    for block in blocks:
        block_type = block.get('type', '')
        data = block.get('data', {})

        fields_to_scan = []
        if block_type == 'text':
            fields_to_scan = [data.get('html', '')]
        elif block_type == 'heading':
            fields_to_scan = [data.get('text', '')]
        elif block_type == 'button':
            fields_to_scan = [data.get('text', ''), data.get('url', '')]
        elif block_type == 'image':
            fields_to_scan = [data.get('alt', ''), data.get('link', '')]
        elif block_type == 'html':
            fields_to_scan = [data.get('html', '')]
        elif block_type == 'columns':
            for col in data.get('columns', []):
                _extract_keys_from_blocks(col.get('blocks', []), keys)

        for field_value in fields_to_scan:
            if field_value:
                keys.update(_VAR_PATTERN.findall(field_value))


def substitute_variables(json_data, variables):
    """
    Substitute ``{{key}}`` placeholders in all block data fields.

    Returns a new json_data dict with substitutions applied.
    For ``data.html`` fields (text and html blocks) the values are HTML-escaped
    since the export engine passes them through raw.  For other fields
    (heading text, button text/url, image alt/link) the values are inserted raw
    because the export engine already escapes those.
    """
    result = copy.deepcopy(json_data)
    for section_name in ('header', 'body', 'footer'):
        section = result.get(section_name, {})
        blocks = section.get('blocks', [])
        _substitute_in_blocks(blocks, variables)
    return result


def _substitute_in_blocks(blocks, variables):
    for block in blocks:
        block_type = block.get('type', '')
        data = block.get('data', {})

        if block_type == 'text':
            data['html'] = _replace_vars(data.get('html', ''), variables, escape=True)
        elif block_type == 'heading':
            data['text'] = _replace_vars(data.get('text', ''), variables, escape=False)
        elif block_type == 'button':
            data['text'] = _replace_vars(data.get('text', ''), variables, escape=False)
            data['url'] = _replace_vars(data.get('url', ''), variables, escape=False)
        elif block_type == 'image':
            data['alt'] = _replace_vars(data.get('alt', ''), variables, escape=False)
            data['link'] = _replace_vars(data.get('link', ''), variables, escape=False)
        elif block_type == 'html':
            data['html'] = _replace_vars(data.get('html', ''), variables, escape=True)
        elif block_type == 'columns':
            for col in data.get('columns', []):
                _substitute_in_blocks(col.get('blocks', []), variables)


def _replace_vars(text, variables, escape=True):
    """Replace ``{{key}}`` with the variable value."""
    if not text:
        return text

    def replacer(match):
        key = match.group(1)
        if key not in variables:
            return match.group(0)  # leave unchanged if not provided
        value = str(variables[key])
        if escape:
            return html_module.escape(value)
        return value

    return _VAR_PATTERN.sub(replacer, text)


# ---------------------------------------------------------------------------
# HTML rendering
# ---------------------------------------------------------------------------

def render_email_html(json_data, variables_mode='placeholders'):
    """
    Convert template JSON to email-compatible HTML.
    Returns dict with 'html' and 'warnings' keys.
    """
    warnings = []
    settings = json_data.get('settings', {})

    background_style = settings.get('backgroundStyle')
    bg_color, bg_css = _resolve_template_background(
        background_style=background_style,
        background_color=settings.get('backgroundColor'),
    )
    content_width = settings.get('contentWidth', 600)
    default_font = settings.get('defaultFont', 'Arial, Helvetica, sans-serif')
    default_font_size = settings.get('defaultFontSize', 14)
    default_color = settings.get('defaultColor', '#333333')

    ctx = {
        'content_width': content_width,
        'default_font': default_font,
        'default_font_size': default_font_size,
        'default_color': default_color,
        'variables_mode': variables_mode,
        'warnings': warnings,
    }

    # Render sections
    header_html = _render_blocks(json_data.get('header', {}).get('blocks', []), ctx)
    body_html = _render_blocks(json_data.get('body', {}).get('blocks', []), ctx)
    footer_html = _render_blocks(json_data.get('footer', {}).get('blocks', []), ctx)

    full_html = _email_skeleton(
        header_html=header_html,
        body_html=body_html,
        footer_html=footer_html,
        bg_color=bg_color,
        bg_css=bg_css,
        content_width=content_width,
        content_bg='#ffffff',
    )

    return {'html': full_html, 'warnings': warnings}


def _email_skeleton(header_html, body_html, footer_html, bg_color, bg_css, content_width, content_bg):
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title></title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }}
    body {{ margin: 0; padding: 0; width: 100% !important; height: 100% !important; }}

    @media only screen and (max-width: {content_width + 20}px) {{
      .email-container {{ width: 100% !important; max-width: 100% !important; }}
      .stack-column {{ display: block !important; width: 100% !important; max-width: 100% !important; }}
      .mobile-padding {{ padding-left: 16px !important; padding-right: 16px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: {bg_color}; background: {bg_css};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: {bg_color}; background: {bg_css};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="{content_width}" cellpadding="0"
               cellspacing="0" border="0" align="center"
               style="margin: 0 auto; background-color: {content_bg};">
          {header_html}
          {body_html}
          {footer_html}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _resolve_template_background(background_style, background_color):
    default_color = '#f4f4f4'
    safe_color = _sanitize_css_color(background_color, default_color)
    preset = BACKGROUND_STYLE_PRESETS.get(background_style)
    if not preset:
        return safe_color, safe_color

    fallback_color = _sanitize_css_color(preset.get('fallback_color'), default_color)
    resolved_color = safe_color if background_color else fallback_color
    return resolved_color, preset['background']


def _sanitize_css_color(value, default):
    if not value:
        return default
    normalized = str(value).strip()
    if CSS_COLOR_PATTERN.match(normalized):
        return normalized
    return default


def _render_blocks(blocks, ctx):
    parts = []
    for block in blocks:
        block_type = block.get('type', '')
        renderer = BLOCK_RENDERERS.get(block_type)
        if renderer:
            parts.append(renderer(block, ctx))
    return '\n'.join(parts)


def _render_text_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    padding = _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'left')

    text_html = data.get('html', '')

    return f"""<tr>
  <td style="padding: {padding}; font-family: {ctx['default_font']}; font-size: {ctx['default_font_size']}px;
             line-height: {int(ctx['default_font_size'] * 1.6)}px; color: {ctx['default_color']};
             text-align: {alignment};">
    {text_html}
  </td>
</tr>"""


def _render_image_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    padding = _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'center')

    src = html_module.escape(data.get('src', ''))
    alt = html_module.escape(data.get('alt', ''))
    width = data.get('width', ctx['content_width'])
    height = data.get('height')
    link = data.get('link', '')

    height_attr = f' height="{height}"' if height else ''

    img_tag = f'<img src="{src}" alt="{alt}" width="{width}"{height_attr} style="display: block; max-width: 100%; height: auto; border: 0;" />'

    if link:
        link_escaped = html_module.escape(link)
        img_tag = f'<a href="{link_escaped}" target="_blank" style="text-decoration: none;">{img_tag}</a>'

    return f"""<tr>
  <td style="padding: {padding};" align="{alignment}">
    {img_tag}
  </td>
</tr>"""


def _render_button_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    padding = _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'center')

    text = html_module.escape(data.get('text', 'Click here'))
    url = html_module.escape(data.get('url', '#'))
    bg_color = style.get('backgroundColor', '#007bff')
    text_color = style.get('color', '#ffffff')
    border_radius = style.get('borderRadius', 4)
    font_size = style.get('fontSize', 16)
    font_family = style.get('fontFamily', ctx['default_font'])
    btn_padding = _padding_str(style.get('padding', {'top': 12, 'right': 24, 'bottom': 12, 'left': 24}))

    return f"""<tr>
  <td style="padding: {padding};" align="{alignment}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="{alignment}">
      <tr>
        <td style="border-radius: {border_radius}px; background-color: {bg_color};" align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                       xmlns:w="urn:schemas-microsoft-com:office:word"
                       href="{url}"
                       style="height:44px;v-text-anchor:middle;width:200px;"
                       arcsize="{int(border_radius / 44 * 100)}%" fillcolor="{bg_color}" strokecolor="{bg_color}">
            <w:anchorlock/>
            <center style="color:{text_color};font-family:{font_family};font-size:{font_size}px;">{text}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="{url}" target="_blank"
             style="display: inline-block; padding: {btn_padding}; background-color: {bg_color};
                    color: {text_color}; font-family: {font_family}; font-size: {font_size}px;
                    text-decoration: none; border-radius: {border_radius}px;">
            {text}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  </td>
</tr>"""


def _render_divider_block(block, ctx):
    style = block.get('style', {})
    line_style = style.get('lineStyle', 'solid')
    line_color = style.get('lineColor', '#cccccc')
    line_thickness = style.get('lineThickness', 1)
    spacing = style.get('spacing', 20)

    return f"""<tr>
  <td style="padding: {spacing}px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="border-top: {line_thickness}px {line_style} {line_color}; font-size: 0; line-height: 0;" height="1">
          &nbsp;
        </td>
      </tr>
    </table>
  </td>
</tr>"""


def _render_columns_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    column_count = data.get('columnCount', 2)
    columns = data.get('columns', [])
    gap = style.get('gap', 10)

    col_width = int((ctx['content_width'] - gap * (column_count - 1)) / column_count)

    cols_html = []
    for i, col in enumerate(columns):
        col_blocks_html = _render_blocks(col.get('blocks', []), ctx)
        # Wrap column blocks in a table row structure
        col_inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          {col_blocks_html}
        </table>"""

        mso_start = f'<!--[if mso]><td width="{col_width}" valign="top"><![endif]-->' if i > 0 else f'<!--[if mso]><table role="presentation" width="{ctx["content_width"]}" cellpadding="0" cellspacing="0" border="0"><tr><td width="{col_width}" valign="top"><![endif]-->'
        mso_end = '<!--[if mso]></td><![endif]-->' if i < column_count - 1 else '<!--[if mso]></td></tr></table><![endif]-->'

        cols_html.append(f"""{mso_start}
      <div style="display: inline-block; width: 100%; max-width: {col_width}px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 0 {gap // 2}px;">
              {col_inner}
            </td>
          </tr>
        </table>
      </div>
      {mso_end}""")

    return f"""<tr>
  <td>
    {''.join(cols_html)}
  </td>
</tr>"""


def _render_social_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    platforms = data.get('platforms', [])
    icon_size = style.get('iconSize', 32)
    alignment = style.get('alignment', 'center')
    spacing = style.get('spacing', 10)

    icons_html = []
    for platform in platforms:
        p_type = html_module.escape(platform.get('type', ''))
        p_url = html_module.escape(platform.get('url', '#'))
        # Use placeholder icon URLs — in production these would be hosted on CDN
        icon_url = f"https://assets.mailcraft.io/icons/{p_type}-{icon_size}.png"
        icons_html.append(f"""<td style="padding: 0 {spacing // 2}px;">
      <a href="{p_url}" target="_blank">
        <img src="{icon_url}" alt="{p_type.title()}" width="{icon_size}" height="{icon_size}"
             style="display: block; border: 0;" />
      </a>
    </td>""")

    return f"""<tr>
  <td align="{alignment}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="{alignment}">
      <tr>
        {''.join(icons_html)}
      </tr>
    </table>
  </td>
</tr>"""


def _render_heading_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    padding = _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'left')
    level = data.get('level', 2)
    text = html_module.escape(data.get('text', ''))
    font_size = style.get('fontSize', 28)
    font_weight = style.get('fontWeight', 700)
    color = style.get('color', ctx['default_color'])
    font_family = style.get('fontFamily', ctx['default_font'])
    bg = style.get('backgroundColor')
    bg_style = f' background-color: {bg};' if bg else ''
    tag = f'h{level}'

    return f"""<tr>
  <td style="padding: {padding}; text-align: {alignment};{bg_style}">
    <{tag} style="margin: 0; font-family: {font_family}; font-size: {font_size}px; line-height: {int(font_size * 1.2)}px; color: {color}; font-weight: {font_weight};">
      {text}
    </{tag}>
  </td>
</tr>"""


def _render_spacer_block(block, ctx):
    style = block.get('style', {})
    height = max(0, style.get('height', 0))
    bg = style.get('backgroundColor')
    bg_style = f' background-color: {bg};' if bg else ''

    return f"""<tr>
  <td style="line-height: 0; font-size: 0; height: {height}px;{bg_style}">
    &nbsp;
  </td>
</tr>"""


def _render_html_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    padding = _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'left')
    bg = style.get('backgroundColor')
    bg_style = f' background-color: {bg};' if bg else ''

    return f"""<tr>
  <td style="padding: {padding}; text-align: {alignment};{bg_style}">
    {data.get('html', '')}
  </td>
</tr>"""


def _padding_str(padding):
    if not padding:
        return '0'
    if isinstance(padding, (int, float)):
        return f'{padding}px'
    top = padding.get('top', 0)
    right = padding.get('right', 0)
    bottom = padding.get('bottom', 0)
    left = padding.get('left', 0)
    return f'{top}px {right}px {bottom}px {left}px'


BLOCK_RENDERERS = {
    'text': _render_text_block,
    'image': _render_image_block,
    'button': _render_button_block,
    'divider': _render_divider_block,
    'columns': _render_columns_block,
    'social': _render_social_block,
    'heading': _render_heading_block,
    'spacer': _render_spacer_block,
    'html': _render_html_block,
}
