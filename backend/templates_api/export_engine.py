"""
Email HTML Export Engine.
Converts template JSON to email-compatible HTML following strict email client rules:
- Table-based layout
- Inline CSS only
- VML fallbacks for Outlook
- Max 600px width
- Web-safe fonts
"""

import html as html_module


def render_email_html(json_data, variables_mode='placeholders'):
    """
    Convert template JSON to email-compatible HTML.
    Returns dict with 'html' and 'warnings' keys.
    """
    warnings = []
    settings = json_data.get('settings', {})

    bg_color = settings.get('backgroundColor', '#ffffff')
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
        content_width=content_width,
        content_bg='#ffffff',
    )

    return {'html': full_html, 'warnings': warnings}


def _email_skeleton(header_html, body_html, footer_html, bg_color, content_width, content_bg):
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
<body style="margin: 0; padding: 0; background-color: {bg_color};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: {bg_color};">
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
}
