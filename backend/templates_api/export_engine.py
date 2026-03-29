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

BODY_BACKGROUND_STYLE_PRESETS = {
    'mesh-blue': {
        'fallback_color': '#eef4ff',
        'background': (
            'radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.09), transparent 42%), '
            'radial-gradient(circle at 84% 20%, rgba(14, 165, 233, 0.08), transparent 38%), '
            'linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #e5edff 100%)'
        ),
    },
    'aurora-soft': {
        'fallback_color': '#f2f3ff',
        'background': (
            'radial-gradient(circle at 15% 10%, rgba(168, 85, 247, 0.11), transparent 36%), '
            'radial-gradient(circle at 85% 24%, rgba(34, 211, 238, 0.1), transparent 34%), '
            'linear-gradient(150deg, #fcfcff 0%, #f2f3ff 45%, #ebf6ff 100%)'
        ),
    },
    'sunset-paper': {
        'fallback_color': '#fff5ef',
        'background': (
            'radial-gradient(circle at 74% 20%, rgba(251, 146, 60, 0.11), transparent 40%), '
            'radial-gradient(circle at 20% 78%, rgba(251, 113, 133, 0.08), transparent 40%), '
            'linear-gradient(145deg, #fffaf7 0%, #fff1e8 55%, #fee4dc 100%)'
        ),
    },
    'carbon-grid': {
        'fallback_color': '#111827',
        'background': (
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), '
            'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), '
            'linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)'
        ),
    },
    'opal-rings': {
        'fallback_color': '#f7f7f5',
        'background': (
            'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.07) 0, rgba(120,113,108,0.07) 1px, transparent 1px), '
            'radial-gradient(circle at 72% 30%, rgba(148,163,184,0.1) 0, rgba(148,163,184,0.1) 2px, transparent 2px), '
            'linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)'
        ),
    },
}

CSS_COLOR_PATTERN = re.compile(r'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$')


# ---------------------------------------------------------------------------
# Variable handling
# ---------------------------------------------------------------------------

_VAR_PATTERN = re.compile(r'\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}')
_VALID_KEY_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')


def validate_variable_key(key):
    """Check that a variable key contains only letters, digits, and underscores."""
    return bool(_VALID_KEY_PATTERN.match(key))


def extract_variable_keys(json_data):
    """Recursively scan all string values in the template and return variable keys."""
    keys = set()
    _extract_keys_recursive(json_data, keys)
    return keys


def _extract_keys_recursive(obj, keys):
    if isinstance(obj, str):
        keys.update(_VAR_PATTERN.findall(obj))
    elif isinstance(obj, dict):
        for v in obj.values():
            _extract_keys_recursive(v, keys)
    elif isinstance(obj, list):
        for item in obj:
            _extract_keys_recursive(item, keys)


def substitute_variables(json_data, variables):
    """
    Recursively substitute ``{{key}}`` placeholders in every string value.

    Returns a new json_data dict with substitutions applied.
    Variable values are HTML-escaped to prevent injection.
    """
    return _substitute_recursive(copy.deepcopy(json_data), variables)


def _substitute_recursive(obj, variables):
    if isinstance(obj, str):
        return _replace_vars(obj, variables)
    if isinstance(obj, dict):
        for k, v in obj.items():
            obj[k] = _substitute_recursive(v, variables)
        return obj
    if isinstance(obj, list):
        for i, item in enumerate(obj):
            obj[i] = _substitute_recursive(item, variables)
        return obj
    return obj


def _replace_vars(text, variables):
    """Replace ``{{key}}`` with the HTML-escaped variable value."""
    if not text:
        return text

    def replacer(match):
        key = match.group(1)
        if key not in variables:
            return match.group(0)
        return html_module.escape(str(variables[key]))

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
    content_bg_color, content_bg_css = _resolve_email_body_background(
        background_style=settings.get('bodyBackgroundStyle'),
        background_color=settings.get('bodyBackgroundColor'),
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

    body_border_radius = settings.get('bodyBorderRadius', 0) or 0
    google_font_link = _collect_google_font_links(json_data)

    full_html = _email_skeleton(
        header_html=header_html,
        body_html=body_html,
        footer_html=footer_html,
        bg_color=bg_color,
        bg_css=bg_css,
        content_width=content_width,
        content_bg_color=content_bg_color,
        content_bg_css=content_bg_css,
        body_border_radius=body_border_radius,
        google_font_link=google_font_link,
    )

    return {'html': full_html, 'warnings': warnings}


def _email_skeleton(
    header_html,
    body_html,
    footer_html,
    bg_color,
    bg_css,
    content_width,
    content_bg_color,
    content_bg_css,
    body_border_radius=0,
    google_font_link='',
):
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title></title>
  {google_font_link}
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
               style="margin: 0 auto; background-color: {content_bg_color}; background: {content_bg_css};{f' border-radius: {body_border_radius}px; overflow: hidden;' if body_border_radius else ''}">
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


def _resolve_email_body_background(background_style, background_color):
    default_color = '#ffffff'
    if background_style in (None, '', 'solid'):
        safe_color = _sanitize_css_color(background_color, default_color)
        return safe_color, safe_color

    preset = BODY_BACKGROUND_STYLE_PRESETS.get(background_style)
    if not preset:
        safe_color = _sanitize_css_color(background_color, default_color)
        return safe_color, safe_color

    fallback_color = _sanitize_css_color(preset.get('fallback_color'), default_color)
    resolved_color = _sanitize_css_color(background_color, fallback_color)
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
    full_width = style.get('fullWidth', False)
    padding = '0' if full_width else _padding_str(style.get('padding', {}))
    alignment = style.get('alignment', 'center')

    src = html_module.escape(data.get('src', ''))
    alt = html_module.escape(data.get('alt', ''))
    width = ctx['content_width'] if full_width else data.get('width', ctx['content_width'])
    height = data.get('height')
    link = data.get('link', '')
    border_radius = style.get('borderRadius', 0) or 0

    height_attr = f' height="{height}"' if height else ''
    radius_style = f' border-radius: {border_radius}px;' if border_radius else ''

    img_tag = f'<img src="{src}" alt="{alt}" width="{width}"{height_attr} style="display: block; max-width: 100%; height: auto; border: 0;{radius_style}" />'

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
    full_width = style.get('fullWidth', False)

    text = html_module.escape(data.get('text', 'Click here'))
    url = html_module.escape(data.get('url', '#'))
    bg_color = style.get('backgroundColor', '#007bff')
    text_color = style.get('color', '#ffffff')
    border_radius = style.get('borderRadius', 4)
    font_size = style.get('fontSize', 16)
    font_family = style.get('fontFamily', ctx['default_font'])
    font_weight = style.get('fontWeight', 600)
    letter_spacing = style.get('letterSpacing', 0)
    text_transform = style.get('textTransform', 'none')
    border_width = style.get('borderWidth', 0)
    border_style = style.get('borderStyle', 'solid')
    border_color = style.get('borderColor', bg_color)
    padding_y = style.get('paddingY', 12)
    padding_x = style.get('paddingX', 24)
    btn_padding = f'{padding_y}px {padding_x}px'

    width_attr = ' width="100%"' if full_width else ''
    table_width_style = 'width: 100%;' if full_width else ''
    btn_display = 'block' if full_width else 'inline-block'
    btn_width = 'width: 100%;' if full_width else ''
    vml_width = '100%' if full_width else '200px'

    return f"""<tr>
  <td style="padding: {padding};" align="{alignment}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="{alignment}"{width_attr} style="{table_width_style}">
      <tr>
        <td style="border-radius: {border_radius}px; background-color: {bg_color}; border: {border_width}px {border_style} {border_color};" align="center">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml"
                       xmlns:w="urn:schemas-microsoft-com:office:word"
                       href="{url}"
                       style="height:44px;v-text-anchor:middle;width:{vml_width};"
                       arcsize="{int(border_radius / 44 * 100)}%" fillcolor="{bg_color}" strokecolor="{bg_color}">
            <w:anchorlock/>
            <center style="color:{text_color};font-family:{font_family};font-size:{font_size}px;">{text}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="{url}" target="_blank"
             style="display: {btn_display}; {btn_width} box-sizing: border-box; padding: {btn_padding}; background-color: {bg_color};
                    color: {text_color}; font-family: {font_family}; font-size: {font_size}px;
                    font-weight: {font_weight}; letter-spacing: {letter_spacing}px; text-transform: {text_transform};
                    text-decoration: none; border-radius: {border_radius}px; border: {border_width}px {border_style} {border_color}; text-align: center;">
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

        col_bg = col.get('backgroundColor')
        col_bg_style = f' background-color: {col_bg};' if col_bg else ''

        cols_html.append(f"""{mso_start}
      <div style="display: inline-block; width: 100%; max-width: {col_width}px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding: 0 {gap // 2}px;{col_bg_style}">
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


_SOCIAL_SVG_PATHS = {
    'facebook':  ('#1877F2', 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.049 1.528.098v3.325h-1.248c-1.703 0-2.244.817-2.244 2.339v1.796h3.337l-.573 3.667h-2.764v8.199C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z'),
    'twitter':   ('#000000', 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z'),
    'instagram': ('#E4405F', 'M7.03.084c-1.277.06-2.149.264-2.913.558a5.886 5.886 0 0 0-2.126 1.384A5.886 5.886 0 0 0 .607 4.152C.314 4.916.11 5.788.05 7.065.006 7.979 0 8.29 0 12.004c0 3.713.006 4.024.05 4.939.06 1.277.264 2.149.558 2.913.306.789.718 1.459 1.384 2.126A5.886 5.886 0 0 0 4.152 23.4c.764.294 1.636.498 2.913.558C7.979 23.994 8.29 24 12.004 24c3.713 0 4.024-.006 4.939-.05 1.277-.06 2.149-.264 2.913-.558a5.886 5.886 0 0 0 2.126-1.384 5.886 5.886 0 0 0 1.384-2.126c.294-.764.498-1.636.558-2.913.044-.915.05-1.226.05-4.939 0-3.713-.006-4.024-.05-4.939-.06-1.277-.264-2.149-.558-2.913a5.886 5.886 0 0 0-1.384-2.126A5.886 5.886 0 0 0 19.861.647C19.097.353 18.225.149 16.948.089 16.033.044 15.722.039 12.008.039h-.01zm-.884 2.167h.888c3.652 0 4.084.013 5.527.08 1.333.061 2.057.284 2.539.472.638.248 1.093.544 1.571 1.022.479.478.775.934 1.023 1.571.188.482.412 1.207.472 2.539.067 1.443.081 1.876.081 5.526s-.014 4.084-.08 5.527c-.061 1.333-.285 2.057-.473 2.539a4.232 4.232 0 0 1-1.023 1.571 4.232 4.232 0 0 1-1.571 1.022c-.482.188-1.206.412-2.539.472-1.443.067-1.875.081-5.527.081s-4.084-.014-5.527-.08c-1.333-.061-2.057-.285-2.539-.473a4.232 4.232 0 0 1-1.571-1.023 4.232 4.232 0 0 1-1.023-1.571c-.188-.482-.411-1.206-.472-2.539-.067-1.443-.08-1.875-.08-5.527s.013-4.084.08-5.527c.061-1.333.284-2.057.472-2.539.248-.638.544-1.093 1.022-1.571a4.232 4.232 0 0 1 1.571-1.022c.482-.188 1.207-.412 2.539-.472 1.264-.057 1.754-.074 4.311-.076v.003zm8.552 1.996a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88zM12.004 5.838a6.166 6.166 0 1 0 0 12.332 6.166 6.166 0 0 0 0-12.332zm0 2.167a4 4 0 1 1 0 8 4 4 0 0 1 0-8z'),
    'linkedin':  ('#0A66C2', 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'),
    'youtube':   ('#FF0000', 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'),
    'tiktok':    ('#000000', 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'),
}


def _social_icon_data_uri(platform):
    entry = _SOCIAL_SVG_PATHS.get(platform)
    if not entry:
        return ''
    color, path = entry
    from urllib.parse import quote
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="{color}"><path d="{path}"/></svg>'
    return f'data:image/svg+xml,{quote(svg)}'


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
        icon_url = _social_icon_data_uri(p_type)
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
    letter_spacing = style.get('letterSpacing', 0) or 0
    text_transform = style.get('textTransform', 'none') or 'none'
    bg = style.get('backgroundColor')
    bg_style = f' background-color: {bg};' if bg else ''
    ls_style = f' letter-spacing: {letter_spacing}px;' if letter_spacing else ''
    tt_style = f' text-transform: {text_transform};' if text_transform != 'none' else ''
    tag = f'h{level}'

    return f"""<tr>
  <td style="padding: {padding}; text-align: {alignment};{bg_style}">
    <{tag} style="margin: 0; font-family: {font_family}; font-size: {font_size}px; line-height: {int(font_size * 1.2)}px; color: {color}; font-weight: {font_weight};{ls_style}{tt_style}">
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


def _render_card_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    default_font = ctx['default_font']

    bg = style.get('backgroundColor', '#ffffff')
    radius = style.get('borderRadius', 12)
    border_w = style.get('borderWidth', 1)
    border_c = style.get('borderColor', '#e2e8f0')
    border_s = style.get('borderStyle', 'solid')
    align = style.get('contentAlignment', 'center')
    padding = _padding_str(style.get('padding', {}))

    heading_color = style.get('headingColor', '#0f172a')
    heading_size = style.get('headingFontSize', 22)
    heading_font = style.get('headingFontFamily', default_font)
    heading_weight = style.get('headingFontWeight', 700)
    body_color = style.get('bodyColor', '#475569')
    body_size = style.get('bodyFontSize', 15)
    body_font = style.get('bodyFontFamily', default_font)

    heading = html_module.escape(data.get('heading', ''))
    body_text = html_module.escape(data.get('body', ''))

    icon_html = ''
    if data.get('showIcon'):
        icon_size = style.get('iconSize', 48)
        icon_radius = style.get('iconBorderRadius', 50)
        if data.get('iconMode') == 'image' and data.get('iconImageSrc'):
            src = html_module.escape(data['iconImageSrc'])
            alt = html_module.escape(data.get('iconImageAlt', ''))
            icon_html = f'<img src="{src}" alt="{alt}" width="{icon_size}" height="{icon_size}" style="border-radius: {icon_radius}%; display: block; margin: 0 auto 12px;" />'
        elif data.get('iconMode') == 'lucide' and data.get('iconName'):
            from templates_api.lucide_icons import lucide_data_uri
            icon_color = style.get('iconColor', '#4f46e5')
            icon_bg = style.get('iconBackgroundColor', '#eef2ff')
            svg_size = int(icon_size * 0.5)
            data_uri = lucide_data_uri(data['iconName'], svg_size, icon_color)
            if data_uri:
                icon_html = (
                    f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 12px;">'
                    f'<tr><td style="width: {icon_size}px; height: {icon_size}px; border-radius: {icon_radius}%; background-color: {icon_bg}; text-align: center; vertical-align: middle;">'
                    f'<img src="{data_uri}" width="{svg_size}" height="{svg_size}" alt="" style="display: inline-block; vertical-align: middle;" />'
                    f'</td></tr></table>'
                )
            else:
                emoji = data.get('iconEmoji', '✨')
                emoji_size = int(icon_size * 0.55)
                icon_html = (
                    f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 12px;">'
                    f'<tr><td style="width: {icon_size}px; height: {icon_size}px; border-radius: {icon_radius}%; background-color: {icon_bg}; text-align: center; vertical-align: middle; font-size: {emoji_size}px; line-height: {icon_size}px;">'
                    f'{emoji}</td></tr></table>'
                )
        else:
            emoji = data.get('iconEmoji', '✨')
            icon_bg = style.get('iconBackgroundColor', '#eef2ff')
            emoji_size = int(icon_size * 0.55)
            icon_html = (
                f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 12px;">'
                f'<tr><td style="width: {icon_size}px; height: {icon_size}px; border-radius: {icon_radius}%; background-color: {icon_bg}; text-align: center; vertical-align: middle; font-size: {emoji_size}px; line-height: {icon_size}px;">'
                f'{emoji}</td></tr></table>'
            )

    badge_html = ''
    if data.get('showBadge'):
        badge_bg = style.get('badgeBackgroundColor', '#eef2ff')
        badge_color = style.get('badgeTextColor', '#4338ca')
        badge_text = html_module.escape(data.get('badgeText', ''))
        badge_html = (
            f'<span style="display: inline-block; padding: 3px 10px; border-radius: 12px; '
            f'background-color: {badge_bg}; color: {badge_color}; font-size: 11px; '
            f'font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; '
            f'font-family: {default_font};">{badge_text}</span>'
        )
        badge_html = f'<div style="margin-bottom: 8px;">{badge_html}</div>'

    btn_html = ''
    if data.get('showButton'):
        btn_bg = style.get('buttonBackgroundColor', '#4f46e5')
        btn_color = style.get('buttonTextColor', '#ffffff')
        btn_radius = style.get('buttonBorderRadius', 6)
        btn_size = style.get('buttonFontSize', 14)
        btn_font = style.get('buttonFontFamily', default_font)
        btn_weight = style.get('buttonFontWeight', 600)
        btn_px = style.get('buttonPaddingX', 20)
        btn_py = style.get('buttonPaddingY', 10)
        btn_full = style.get('buttonFullWidth', False)
        btn_border_w = style.get('buttonBorderWidth', 0)
        btn_border_c = style.get('buttonBorderColor', btn_bg)
        btn_border_s = style.get('buttonBorderStyle', 'solid')
        btn_text = html_module.escape(data.get('buttonText', ''))
        btn_url = html_module.escape(data.get('buttonUrl', '#'))
        display = 'block' if btn_full else 'inline-block'
        width = 'width: 100%; box-sizing: border-box;' if btn_full else ''
        btn_html = (
            f'<div style="margin-top: 16px;">'
            f'<a href="{btn_url}" target="_blank" style="display: {display}; {width} '
            f'padding: {btn_py}px {btn_px}px; background-color: {btn_bg}; color: {btn_color}; '
            f'font-family: {btn_font}; font-size: {btn_size}px; font-weight: {btn_weight}; '
            f'text-decoration: none; text-align: center; border-radius: {btn_radius}px; '
            f'border: {btn_border_w}px {btn_border_s} {btn_border_c};">'
            f'{btn_text}</a></div>'
        )

    border = f'{border_w}px {border_s} {border_c}' if border_w > 0 else 'none'

    return f"""<tr>
  <td style="padding: {padding};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: {bg}; border-radius: {radius}px; border: {border};">
      <tr>
        <td style="padding: {padding}; text-align: {align};">
          {icon_html}
          {badge_html}
          <h3 style="margin: 0 0 8px; font-family: {heading_font}; font-size: {heading_size}px; font-weight: {heading_weight}; color: {heading_color}; line-height: 1.3;">{heading}</h3>
          <p style="margin: 0 0 16px; font-family: {body_font}; font-size: {body_size}px; color: {body_color}; line-height: 1.5;">{body_text}</p>
          {btn_html}
        </td>
      </tr>
    </table>
  </td>
</tr>"""


def _render_hero_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    bg_img = html_module.escape(data.get('backgroundImage', ''))
    height = style.get('height', 400)
    overlay_color = style.get('overlayColor', '#000000')
    overlay_opacity = style.get('overlayOpacity', 0.4)
    overlay_rgba = _hex_to_rgba(overlay_color, overlay_opacity)
    heading_color = style.get('headingColor', '#ffffff')
    heading_size = style.get('headingFontSize', 32)
    heading_font = style.get('headingFontFamily', ctx['default_font'])
    sub_color = style.get('subheadingColor', '#ffffffcc')
    btn_bg = style.get('buttonBackgroundColor', '#ffffff')
    btn_color = style.get('buttonTextColor', '#000000')
    btn_radius = style.get('buttonBorderRadius', 50)
    align = style.get('contentAlignment', 'center')
    v_align = style.get('verticalAlignment', 'bottom')
    valign_attr = 'top' if v_align == 'top' else ('middle' if v_align == 'center' else 'bottom')
    grad_dir = 'to bottom' if v_align == 'top' else 'to top'
    heading = html_module.escape(data.get('heading', ''))
    sub = html_module.escape(data.get('subheading', ''))
    btn_text = html_module.escape(data.get('buttonText', ''))
    btn_url = html_module.escape(data.get('buttonUrl', '#'))
    content_width = ctx['content_width']
    default_font = ctx['default_font']
    default_font_size = ctx['default_font_size']

    sub_html = f'<p style="margin: 0 0 20px; font-family: {default_font}; font-size: {default_font_size}px; color: {sub_color}; line-height: 1.5;">{sub}</p>' if sub else ''
    btn_html = f'<a href="{btn_url}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: {btn_bg}; color: {btn_color}; font-family: {default_font}; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: {btn_radius}px;">{btn_text}</a>' if btn_text else ''

    return f"""<tr>
  <td background="{bg_img}" width="{content_width}" height="{height}" valign="{valign_attr}"
      style="background-image: url('{bg_img}'); background-size: cover; background-position: center; height: {height}px;">
    <!--[if gte mso 9]>
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:{content_width}px;height:{height}px;">
      <v:fill type="tile" src="{bg_img}" />
      <v:textbox inset="0,0,0,0">
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height: {height}px;">
      <tr>
        <td style="background: linear-gradient({grad_dir}, {overlay_rgba} 60%, transparent 100%); padding: 32px; text-align: {align};" valign="{valign_attr}">
          <h1 style="margin: 0 0 8px; font-family: {heading_font}; font-size: {heading_size}px; line-height: {int(heading_size * 1.15)}px; color: {heading_color}; font-weight: 700;">{heading}</h1>
          {sub_html}
          {btn_html}
        </td>
      </tr>
    </table>
    <!--[if gte mso 9]>
      </v:textbox>
    </v:rect>
    <![endif]-->
  </td>
</tr>"""


def _hex_to_rgba(hex_color, opacity):
    h = hex_color.lstrip('#')
    if len(h) < 6:
        h = h + '0' * (6 - len(h))
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return f'rgba({r}, {g}, {b}, {opacity})'


_GOOGLE_FONT_SLUGS = {
    'Noto Serif': 'Noto+Serif:wght@400;700',
    'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@300;400;500;600;700',
    'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@300;400;500;600;700',
    'Inter': 'Inter:wght@300;400;500;600;700',
    'Playfair Display': 'Playfair+Display:wght@400;700',
    'Lora': 'Lora:wght@400;700',
    'Montserrat': 'Montserrat:wght@300;400;500;600;700',
    'Open Sans': 'Open+Sans:wght@300;400;600;700',
    'Raleway': 'Raleway:wght@300;400;500;600;700',
    'Poppins': 'Poppins:wght@300;400;500;600;700',
    'Roboto': 'Roboto:wght@300;400;500;700',
    'DM Sans': 'DM+Sans:wght@400;500;600;700',
    'Source Serif 4': 'Source+Serif+4:wght@400;600;700',
    'Merriweather': 'Merriweather:wght@400;700',
}


def _collect_google_font_links(json_data):
    fonts = set()
    settings = json_data.get('settings', {})
    fonts.add(settings.get('defaultFont', ''))

    def scan_blocks(blocks):
        for block in blocks:
            style = block.get('style', {})
            if style.get('fontFamily'):
                fonts.add(style['fontFamily'])
            if style.get('headingFontFamily'):
                fonts.add(style['headingFontFamily'])
            data = block.get('data', {})
            for col in data.get('columns', []):
                scan_blocks(col.get('blocks', []))

    for section in ('header', 'body', 'footer'):
        scan_blocks(json_data.get(section, {}).get('blocks', []))

    names = set()
    for ff in fonts:
        for name in _GOOGLE_FONT_SLUGS:
            if name in ff:
                names.add(name)

    if not names:
        return ''
    families = '&family='.join(_GOOGLE_FONT_SLUGS[n] for n in sorted(names))
    return f'<link href="https://fonts.googleapis.com/css2?family={families}&display=swap" rel="stylesheet">'


def _render_list_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    default_font = ctx['default_font']
    items = data.get('items', [])
    if not items:
        return ''

    padding = _padding_str(style.get('padding', {}))
    bg = style.get('backgroundColor', 'transparent')
    align = style.get('contentAlignment', 'left')
    icon_size = style.get('iconSize', 20)
    icon_color = style.get('iconColor', '#4f46e5')
    txt_color = style.get('textColor', '#0f172a')
    txt_size = style.get('textFontSize', 15)
    txt_font = style.get('textFontFamily', default_font)
    txt_weight = style.get('textFontWeight', 500)
    sub_color = style.get('subtitleColor', '#64748b')
    sub_size = style.get('subtitleFontSize', 13)
    gap = style.get('spacing', 12)
    is_horiz = style.get('layout') == 'horizontal'

    def render_item(item, pad_bottom=True):
        text = html_module.escape(item.get('text', ''))
        subtitle = item.get('subtitle', '')
        sub_html = ''
        if subtitle:
            sub_html = (
                f'<div style="color: {sub_color}; font-size: {sub_size}px; '
                f'font-family: {txt_font}; line-height: 1.4; margin-top: 2px;">'
                f'{html_module.escape(subtitle)}</div>'
            )
        v_align = 'top' if subtitle else 'middle'
        pad_top = '2px' if subtitle else '0'

        # Render icon: Lucide SVG or text/emoji
        item_icon_mode = item.get('iconMode', 'text')
        item_icon_name = item.get('iconName', '')
        if item_icon_mode == 'lucide' and item_icon_name:
            from templates_api.lucide_icons import lucide_data_uri
            data_uri = lucide_data_uri(item_icon_name, icon_size, icon_color)
            icon_cell = (
                f'<td style="width: {icon_size + 4}px; text-align: center; vertical-align: {v_align}; '
                f'line-height: 1; padding-top: {pad_top};">'
                f'<img src="{data_uri}" width="{icon_size}" height="{icon_size}" alt="" style="display: inline-block; vertical-align: middle;" />'
                f'</td>'
            )
        else:
            icon = html_module.escape(item.get('icon', '•'))
            icon_cell = (
                f'<td style="width: {icon_size + 4}px; text-align: center; vertical-align: {v_align}; '
                f'font-size: {icon_size}px; color: {icon_color}; line-height: 1; padding-top: {pad_top};">{icon}</td>'
            )

        return (
            f'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
            f'{icon_cell}'
            f'<td style="padding-left: 10px; vertical-align: top;">'
            f'<span style="color: {txt_color}; font-size: {txt_size}px; font-family: {txt_font}; '
            f'font-weight: {txt_weight}; line-height: 1.4;">{text}</span>'
            f'{sub_html}</td>'
            f'</tr></table>'
        )

    if is_horiz:
        cells = ''.join(
            f'<td style="padding: 0 {gap // 2}px 0 0; vertical-align: top;">{render_item(item, False)}</td>'
            for item in items
        )
        table_content = f'<tr>{cells}</tr>'
        width_attr = ''
        align_attr = f' align="{align}"'
    else:
        rows = ''.join(
            f'<tr><td style="padding-bottom: {gap}px;">{render_item(item)}</td></tr>'
            for item in items
        )
        table_content = rows
        width_attr = ' width="100%"'
        align_attr = ''

    return f"""<tr>
  <td style="padding: {padding}; background-color: {bg}; text-align: {align};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"{width_attr}{align_attr}>
      {table_content}
    </table>
  </td>
</tr>"""


def _render_profile_block(block, ctx):
    data = block.get('data', {})
    style = block.get('style', {})
    default_font = ctx['default_font']
    padding = _padding_str(style.get('padding', {}))

    bg = style.get('backgroundColor', '#ffffff')
    radius = style.get('borderRadius', 12)
    border_w = style.get('borderWidth', 1)
    border_c = style.get('borderColor', '#e2e8f0')
    border_s = style.get('borderStyle', 'solid')
    border = f'{border_w}px {border_s} {border_c}' if border_w > 0 else 'none'

    img_size = style.get('imageSize', 72)
    img_radius = style.get('imageBorderRadius', 50)
    img_pos = style.get('imagePosition', 'left')
    align = style.get('contentAlignment', 'left')

    name_color = style.get('nameColor', '#0f172a')
    name_size = style.get('nameFontSize', 18)
    name_font = style.get('nameFontFamily', default_font)
    name_weight = style.get('nameFontWeight', 700)
    role_color = style.get('roleColor', '#6366f1')
    role_size = style.get('roleFontSize', 13)
    bio_color = style.get('bioColor', '#64748b')
    bio_size = style.get('bioFontSize', 14)
    bio_font = style.get('bioFontFamily', default_font)

    img_src = html_module.escape(data.get('imageSrc', ''))
    img_alt = html_module.escape(data.get('imageAlt', ''))
    name = html_module.escape(data.get('name', ''))
    role_text = html_module.escape(data.get('role', ''))
    bio_text = html_module.escape(data.get('bio', ''))

    badge_html = ''
    if data.get('showBadge') and data.get('badgeText'):
        badge_bg = style.get('badgeBackgroundColor', '#eef2ff')
        badge_color = style.get('badgeTextColor', '#4338ca')
        badge_text = html_module.escape(data['badgeText'])
        badge_html = (
            f'<div style="margin-bottom: 4px;">'
            f'<span style="display: inline-block; padding: 2px 8px; border-radius: 10px; '
            f'background-color: {badge_bg}; color: {badge_color}; font-size: 10px; '
            f'font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; '
            f'font-family: {default_font};">{badge_text}</span></div>'
        )

    img_html = (
        f'<img src="{img_src}" alt="{img_alt}" width="{img_size}" height="{img_size}" '
        f'style="border-radius: {img_radius}%; display: block;" />'
    ) if img_src else ''

    role_html = (
        f'<div style="color: {role_color}; font-size: {role_size}px; font-family: {bio_font}; '
        f'font-weight: 600; line-height: 1.3; margin-top: 2px;">{role_text}</div>'
    ) if role_text else ''

    bio_html = (
        f'<div style="color: {bio_color}; font-size: {bio_size}px; font-family: {bio_font}; '
        f'line-height: 1.5; margin-top: 6px;">{bio_text}</div>'
    ) if bio_text else ''

    name_html = (
        f'<div style="color: {name_color}; font-size: {name_size}px; font-family: {name_font}; '
        f'font-weight: {name_weight}; line-height: 1.3;">{name}</div>'
    )

    if img_pos == 'top':
        img_block = f'<div style="margin: 0 auto 12px; width: {img_size}px;">{img_html}</div>' if img_html else ''
        inner = (
            f'<td style="text-align: {align};">'
            f'{img_block}{badge_html}{name_html}{role_html}{bio_html}</td>'
        )
    else:
        img_td = f'<td style="width: {img_size}px; vertical-align: top;">{img_html}</td>'
        text_td = (
            f'<td style="vertical-align: top; padding-left: 16px; text-align: left;">'
            f'{badge_html}{name_html}{role_html}{bio_html}</td>'
        )
        inner = (f'{text_td}{img_td}' if img_pos == 'right' else f'{img_td}{text_td}')

    width_attr = '' if img_pos == 'top' else ' width="100%"'

    return f"""<tr>
  <td style="padding: {padding};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: {bg}; border-radius: {radius}px; border: {border};">
      <tr>
        <td style="padding: {padding};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"{width_attr}>
            <tr>{inner}</tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>"""


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
    'hero': _render_hero_block,
    'card': _render_card_block,
    'list': _render_list_block,
    'profile': _render_profile_block,
}
