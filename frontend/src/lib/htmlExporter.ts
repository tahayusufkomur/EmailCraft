import type { Block, EmailTemplate } from '../types/blocks';

/**
 * Client-side HTML exporter for preview purposes.
 * The server-side export (/api/v1/export/html) is the canonical export.
 * This is used for real-time preview in the editor.
 */
export function exportToHtml(template: EmailTemplate, _variablesMode: 'placeholders' | 'defaults' = 'placeholders'): string {
  const { settings } = template;
  const contentWidth = settings.contentWidth || 600;

  const headerHtml = renderBlocks(template.header.blocks, settings);
  const bodyHtml = renderBlocks(template.body.blocks, settings);
  const footerHtml = renderBlocks(template.footer.blocks, settings);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title></title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    @media only screen and (max-width: ${contentWidth + 20}px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${settings.backgroundColor || '#f4f4f4'};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: ${settings.backgroundColor || '#f4f4f4'};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="${contentWidth}" cellpadding="0"
               cellspacing="0" border="0" align="center"
               style="margin: 0 auto; background-color: #ffffff;">
          ${headerHtml}
          ${bodyHtml}
          ${footerHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderBlocks(blocks: Block[], settings: EmailTemplate['settings']): string {
  return blocks.map((block) => renderBlock(block, settings)).join('\n');
}

function renderBlock(block: Block, settings: EmailTemplate['settings']): string {
  const font = settings.defaultFont || 'Arial, Helvetica, sans-serif';
  const fontSize = settings.defaultFontSize || 14;
  const color = settings.defaultColor || '#333333';

  switch (block.type) {
    case 'text': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      return `<tr>
  <td style="padding: ${padding}; font-family: ${font}; font-size: ${fontSize}px;
             line-height: ${Math.round(fontSize * 1.6)}px; color: ${color}; text-align: ${align};">
    ${block.data.html}
  </td>
</tr>`;
    }

    case 'image': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'center';
      const src = escapeHtml(block.data.src);
      const alt = escapeHtml(block.data.alt);
      const width = block.data.width || 600;
      const heightAttr = block.data.height ? ` height="${block.data.height}"` : '';

      let imgTag = `<img src="${src}" alt="${alt}" width="${width}"${heightAttr} style="display: block; max-width: 100%; height: auto; border: 0;" />`;

      if (block.data.link) {
        imgTag = `<a href="${escapeHtml(block.data.link)}" target="_blank" style="text-decoration: none;">${imgTag}</a>`;
      }

      return `<tr>
  <td style="padding: ${padding};" align="${align}">
    ${imgTag}
  </td>
</tr>`;
    }

    case 'button': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'center';
      const text = escapeHtml(block.data.text);
      const url = escapeHtml(block.data.url);
      const bgColor = block.style.backgroundColor || '#007bff';
      const textColor = block.style.color || '#ffffff';
      const borderRadius = block.style.borderRadius || 4;
      const btnFontSize = block.style.fontSize || 16;
      const btnFont = block.style.fontFamily || font;

      return `<tr>
  <td style="padding: ${padding};" align="${align}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}">
      <tr>
        <td style="border-radius: ${borderRadius}px; background-color: ${bgColor};" align="center">
          <a href="${url}" target="_blank"
             style="display: inline-block; padding: 12px 24px; background-color: ${bgColor};
                    color: ${textColor}; font-family: ${btnFont}; font-size: ${btnFontSize}px;
                    text-decoration: none; border-radius: ${borderRadius}px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    }

    case 'divider': {
      const lineStyle = block.style.lineStyle || 'solid';
      const lineColor = block.style.lineColor || '#cccccc';
      const thickness = block.style.lineThickness || 1;
      const spacing = block.style.spacing || 20;

      return `<tr>
  <td style="padding: ${spacing}px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="border-top: ${thickness}px ${lineStyle} ${lineColor}; font-size: 0; line-height: 0;" height="1">
          &nbsp;
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    }

    case 'columns': {
      const colCount = block.data.columnCount || 2;
      const gap = block.style.gap || 10;
      const contentWidth = settings.contentWidth || 600;
      const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) / colCount);

      const colsHtml = block.data.columns.map((col) => {
        const colContent = renderBlocks(col.blocks, settings);
        const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${colContent}</table>`;

        return `<div style="display: inline-block; width: 100%; max-width: ${colWidth}px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding: 0 ${gap / 2}px;">${inner}</td></tr>
        </table>
      </div>`;
      }).join('\n');

      return `<tr><td>${colsHtml}</td></tr>`;
    }

    case 'social': {
      const align = block.style.alignment || 'center';
      const iconSize = block.style.iconSize || 32;
      const spacing = block.style.spacing || 10;

      const iconsHtml = block.data.platforms.map((p) => {
        const url = escapeHtml(p.url);
        const iconUrl = `https://assets.mailcraft.io/icons/${p.type}-${iconSize}.png`;
        return `<td style="padding: 0 ${spacing / 2}px;">
      <a href="${url}" target="_blank">
        <img src="${iconUrl}" alt="${p.type}" width="${iconSize}" height="${iconSize}" style="display: block; border: 0;" />
      </a>
    </td>`;
      }).join('\n');

      return `<tr>
  <td align="${align}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}">
      <tr>${iconsHtml}</tr>
    </table>
  </td>
</tr>`;
    }

    default:
      return '';
  }
}

function paddingStr(padding?: { top: number; right: number; bottom: number; left: number }): string {
  if (!padding) return '0';
  return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
