import type { Block, EmailTemplate } from '../types/blocks';
import { getEmailBackgroundCss, getEmailBodyBackgroundCss } from './backgroundStyles';
import { collectTemplateFonts, getGoogleFontLinks } from './fonts';

/**
 * Client-side HTML exporter for preview purposes.
 * The server-side export (/api/v1/export/html) is the canonical export.
 * This is used for real-time preview in the editor.
 */
export function exportToHtml(template: EmailTemplate, variablesMode: 'placeholders' | 'defaults' = 'placeholders'): string {
  void variablesMode;
  const { settings } = template;
  const contentWidth = settings.contentWidth || 600;
  const emailBackground = getEmailBackgroundCss(settings.backgroundStyle, settings.backgroundColor);
  const emailBodyBackground = getEmailBodyBackgroundCss(
    settings.bodyBackgroundStyle,
    settings.bodyBackgroundColor,
  );

  const headerHtml = renderBlocks(template.header.blocks, settings);
  const bodyHtml = renderBlocks(template.body.blocks, settings);
  const footerHtml = renderBlocks(template.footer.blocks, settings);
  const googleFontLink = getGoogleFontLinks(collectTemplateFonts(template));

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title></title>
  ${googleFontLink}
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
<body style="margin: 0; padding: 0; background-color: ${emailBackground.backgroundColor}; background: ${emailBackground.background};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color: ${emailBackground.backgroundColor}; background: ${emailBackground.background};">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" class="email-container" width="${contentWidth}" cellpadding="0"
               cellspacing="0" border="0" align="center"
               style="margin: 0 auto; background-color: ${emailBodyBackground.backgroundColor}; background: ${emailBodyBackground.background};${settings.bodyBorderRadius ? ` border-radius: ${settings.bodyBorderRadius}px; overflow: hidden;` : ''}">
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
      const background = block.style.backgroundColor;
      const gradient = block.style.backgroundGradient;
      return `<tr>
  <td style="padding: ${padding}; font-family: ${font}; font-size: ${fontSize}px;
             line-height: ${Math.round(fontSize * 1.6)}px; color: ${color}; text-align: ${align};${background ? ` background-color: ${background};` : ''}${gradient ? ` background: ${gradient};` : ''}">
    ${block.data.html}
  </td>
</tr>`;
    }

    case 'image': {
      const isFullWidth = block.style.fullWidth || false;
      const padding = isFullWidth ? '0' : paddingStr(block.style.padding);
      const align = block.style.alignment || 'center';
      const src = escapeHtml(block.data.src);
      const alt = escapeHtml(block.data.alt);
      const width = isFullWidth ? (settings.contentWidth || 600) : (block.data.width || 600);
      const heightAttr = block.data.height ? ` height="${block.data.height}"` : '';
      const borderRadius = block.style.borderRadius || 0;
      const radiusStyle = borderRadius > 0 ? ` border-radius: ${borderRadius}px;` : '';

      let imgTag = `<img src="${src}" alt="${alt}" width="${width}"${heightAttr} style="display: block; max-width: 100%; height: auto; border: 0;${radiusStyle}" />`;

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
      const borderStyle = block.style.borderStyle || 'solid';
      const borderColor = block.style.borderColor || bgColor;
      const borderWidth = block.style.borderWidth || 0;
      const fontWeight = block.style.fontWeight || 600;
      const letterSpacing = block.style.letterSpacing || 0;
      const textTransform = block.style.textTransform || 'none';
      const paddingX = block.style.paddingX || 24;
      const paddingY = block.style.paddingY || 12;
      const fullWidth = block.style.fullWidth || false;
      const btnWidth = fullWidth ? '100%' : 'auto';
      const btnDisplay = fullWidth ? 'block' : 'inline-block';
      const widthAttr = fullWidth ? ' width="100%"' : '';

      return `<tr>
  <td style="padding: ${padding};" align="${align}">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}"${widthAttr} style="${fullWidth ? 'width: 100%;' : ''}">
      <tr>
        <td style="border-radius: ${borderRadius}px; background-color: ${bgColor}; border: ${borderWidth}px ${borderStyle} ${borderColor};" align="center">
          <a href="${url}" target="_blank"
             style="display: ${btnDisplay}; width: ${btnWidth}; box-sizing: border-box; padding: ${paddingY}px ${paddingX}px; background-color: ${bgColor};
                    color: ${textColor}; font-family: ${btnFont}; font-size: ${btnFontSize}px;
                    font-weight: ${fontWeight}; letter-spacing: ${letterSpacing}px; text-transform: ${textTransform};
                    text-decoration: none; border-radius: ${borderRadius}px; border: ${borderWidth}px ${borderStyle} ${borderColor};">
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
      const defaultRatio = Math.floor(100 / colCount);
      const ratios = block.data.columnRatio.length === colCount
        ? block.data.columnRatio
        : Array.from({ length: colCount }, () => defaultRatio);

      const colsHtml = block.data.columns.map((col, index) => {
        const ratio = ratios[index] || defaultRatio;
        const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) * (ratio / 100));
        const colContent = renderBlocks(col.blocks, settings);
        const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${colContent}</table>`;
        const stackClass = block.style.stackOnMobile === false ? '' : 'stack-column';
        const colBg = col.backgroundColor ? ` background-color: ${col.backgroundColor};` : '';

        return `<div class="${stackClass}" style="display: inline-block; width: 100%; max-width: ${colWidth}px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding: 0 ${gap / 2}px;${colBg}">${inner}</td></tr>
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
        const iconUrl = socialIconDataUri(p.type);
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

    case 'heading': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      const headingTag = `h${block.data.level || 2}`;
      const headingText = escapeHtml(block.data.text);
      const headingSize = block.style.fontSize || 28;
      const headingWeight = block.style.fontWeight || 700;
      const headingColor = block.style.color || color;
      const headingFont = block.style.fontFamily || font;
      const headingLetterSpacing = block.style.letterSpacing || 0;
      const headingTextTransform = block.style.textTransform || 'none';
      const background = block.style.backgroundColor;
      return `<tr>
  <td style="padding: ${padding}; text-align: ${align};${background ? ` background-color: ${background};` : ''}">
    <${headingTag} style="margin: 0; font-family: ${headingFont}; font-size: ${headingSize}px; line-height: ${Math.round(headingSize * 1.2)}px; color: ${headingColor}; font-weight: ${headingWeight};${headingLetterSpacing ? ` letter-spacing: ${headingLetterSpacing}px;` : ''}${headingTextTransform !== 'none' ? ` text-transform: ${headingTextTransform};` : ''}">
      ${headingText}
    </${headingTag}>
  </td>
</tr>`;
    }

    case 'spacer': {
      const height = Math.max(0, block.style.height || 0);
      const background = block.style.backgroundColor;
      return `<tr>
  <td style="line-height: 0; font-size: 0; height: ${height}px;${background ? ` background-color: ${background};` : ''}">
    &nbsp;
  </td>
</tr>`;
    }

    case 'html': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      const background = block.style.backgroundColor;
      const gradient = block.style.backgroundGradient;
      return `<tr>
  <td style="padding: ${padding}; text-align: ${align};${background ? ` background-color: ${background};` : ''}${gradient ? ` background: ${gradient};` : ''}">
    ${block.data.html}
  </td>
</tr>`;
    }

    case 'hero': {
      const contentW = settings.contentWidth || 600;
      const bgImg = escapeHtml(block.data.backgroundImage);
      const h = block.style.height || 400;
      const overlayColor = block.style.overlayColor || '#000000';
      const overlayOpacity = block.style.overlayOpacity ?? 0.4;
      const overlayRgba = hexToRgba(overlayColor, overlayOpacity);
      const headingColor = block.style.headingColor || '#ffffff';
      const headingSize = block.style.headingFontSize || 32;
      const headingFont = block.style.headingFontFamily || font;
      const subColor = block.style.subheadingColor || '#ffffffcc';
      const btnBg = block.style.buttonBackgroundColor || '#ffffff';
      const btnColor = block.style.buttonTextColor || '#000000';
      const btnRadius = block.style.buttonBorderRadius || 50;
      const align = block.style.contentAlignment || 'center';
      const vAlign = block.style.verticalAlignment || 'bottom';
      const valignAttr = vAlign === 'top' ? 'top' : vAlign === 'center' ? 'middle' : 'bottom';
      const gradDir = vAlign === 'top' ? 'to bottom' : 'to top';
      const heading = escapeHtml(block.data.heading);
      const sub = escapeHtml(block.data.subheading);
      const btnText = escapeHtml(block.data.buttonText);
      const btnUrl = escapeHtml(block.data.buttonUrl);

      return `<tr>
  <td background="${bgImg}" width="${contentW}" height="${h}" valign="${valignAttr}" style="background-image: url('${bgImg}'); background-size: cover; background-position: center; height: ${h}px;">
    <!--[if gte mso 9]>
    <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${contentW}px;height:${h}px;">
      <v:fill type="tile" src="${bgImg}" />
      <v:textbox inset="0,0,0,0">
    <![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height: ${h}px;">
      <tr>
        <td style="background: linear-gradient(${gradDir}, ${overlayRgba} 60%, transparent 100%); padding: 32px; text-align: ${align};" valign="${valignAttr}">
          <h1 style="margin: 0 0 8px; font-family: ${headingFont}; font-size: ${headingSize}px; line-height: ${Math.round(headingSize * 1.15)}px; color: ${headingColor}; font-weight: 700;">${heading}</h1>
          ${sub ? `<p style="margin: 0 0 20px; font-family: ${font}; font-size: ${fontSize}px; color: ${subColor}; line-height: 1.5;">${sub}</p>` : ''}
          ${btnText ? `<a href="${btnUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: ${btnBg}; color: ${btnColor}; font-family: ${font}; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: ${btnRadius}px;">${btnText}</a>` : ''}
        </td>
      </tr>
    </table>
    <!--[if gte mso 9]>
      </v:textbox>
    </v:rect>
    <![endif]-->
  </td>
</tr>`;
    }

    case 'card': {
      const bg = block.style.backgroundColor || '#ffffff';
      const radius = block.style.borderRadius ?? 12;
      const borderW = block.style.borderWidth ?? 1;
      const borderC = block.style.borderColor || '#e2e8f0';
      const borderS = block.style.borderStyle || 'solid';
      const cardAlign = block.style.contentAlignment || 'center';
      const hColor = block.style.headingColor || '#0f172a';
      const hSize = block.style.headingFontSize || 22;
      const hFont = block.style.headingFontFamily || font;
      const hWeight = block.style.headingFontWeight || 700;
      const bColor = block.style.bodyColor || '#475569';
      const bSize = block.style.bodyFontSize || 15;
      const bFont = block.style.bodyFontFamily || font;

      let iconHtml = '';
      if (block.data.showIcon) {
        const iSize = block.style.iconSize ?? 48;
        const iRadius = block.style.iconBorderRadius ?? 50;
        if (block.data.iconMode === 'image' && block.data.iconImageSrc) {
          iconHtml = `<img src="${escapeHtml(block.data.iconImageSrc)}" alt="${escapeHtml(block.data.iconImageAlt)}" width="${iSize}" height="${iSize}" style="border-radius: ${iRadius}%; display: block; margin: 0 auto 12px;" />`;
        } else {
          const iBg = block.style.iconBackgroundColor || '#eef2ff';
          const emojiSize = Math.round(iSize * 0.55);
          iconHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 12px;"><tr><td style="width: ${iSize}px; height: ${iSize}px; border-radius: ${iRadius}%; background-color: ${iBg}; text-align: center; vertical-align: middle; font-size: ${emojiSize}px; line-height: ${iSize}px;">${block.data.iconEmoji || '✨'}</td></tr></table>`;
        }
      }

      let badgeHtml = '';
      if (block.data.showBadge) {
        const bdBg = block.style.badgeBackgroundColor || '#eef2ff';
        const bdColor = block.style.badgeTextColor || '#4338ca';
        badgeHtml = `<div style="margin-bottom: 8px;"><span style="display: inline-block; padding: 3px 10px; border-radius: 12px; background-color: ${bdBg}; color: ${bdColor}; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-family: ${font};">${escapeHtml(block.data.badgeText)}</span></div>`;
      }

      let btnHtml = '';
      if (block.data.showButton) {
        const btnBg = block.style.buttonBackgroundColor || '#4f46e5';
        const btnCol = block.style.buttonTextColor || '#ffffff';
        const btnRad = block.style.buttonBorderRadius ?? 6;
        const btnFSize = block.style.buttonFontSize || 14;
        const btnFFont = block.style.buttonFontFamily || font;
        const btnFW = block.style.buttonFontWeight || 600;
        const btnPx = block.style.buttonPaddingX ?? 20;
        const btnPy = block.style.buttonPaddingY ?? 10;
        const btnFull = block.style.buttonFullWidth;
        const btnBW = block.style.buttonBorderWidth ?? 0;
        const btnBC = block.style.buttonBorderColor || btnBg;
        const btnBS = block.style.buttonBorderStyle || 'solid';
        const disp = btnFull ? 'block' : 'inline-block';
        const w = btnFull ? 'width: 100%; box-sizing: border-box;' : '';
        btnHtml = `<div style="margin-top: 16px;"><a href="${escapeHtml(block.data.buttonUrl)}" target="_blank" style="display: ${disp}; ${w} padding: ${btnPy}px ${btnPx}px; background-color: ${btnBg}; color: ${btnCol}; font-family: ${btnFFont}; font-size: ${btnFSize}px; font-weight: ${btnFW}; text-decoration: none; text-align: center; border-radius: ${btnRad}px; border: ${btnBW}px ${btnBS} ${btnBC};">${escapeHtml(block.data.buttonText)}</a></div>`;
      }

      const border = borderW > 0 ? `${borderW}px ${borderS} ${borderC}` : 'none';
      return `<tr>
  <td style="padding: ${paddingStr(block.style.padding)};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${bg}; border-radius: ${radius}px; border: ${border};">
      <tr>
        <td style="padding: ${paddingStr(block.style.padding)}; text-align: ${cardAlign};">
          ${iconHtml}
          ${badgeHtml}
          <h3 style="margin: 0 0 8px; font-family: ${hFont}; font-size: ${hSize}px; font-weight: ${hWeight}; color: ${hColor}; line-height: 1.3;">${escapeHtml(block.data.heading)}</h3>
          <p style="margin: 0 0 16px; font-family: ${bFont}; font-size: ${bSize}px; color: ${bColor}; line-height: 1.5;">${escapeHtml(block.data.body)}</p>
          ${btnHtml}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
    }

    case 'list': {
      const listPad = paddingStr(block.style.padding);
      const listBg = block.style.backgroundColor || 'transparent';
      const listAlign = block.style.contentAlignment || 'left';
      const iconSz = block.style.iconSize || 20;
      const iconCol = block.style.iconColor || '#4f46e5';
      const txtCol = block.style.textColor || '#0f172a';
      const txtSz = block.style.textFontSize || 15;
      const txtFont = block.style.textFontFamily || font;
      const txtWt = block.style.textFontWeight || 500;
      const subCol = block.style.subtitleColor || '#64748b';
      const subSz = block.style.subtitleFontSize || 13;
      const gap = block.style.spacing || 12;
      const isHoriz = block.style.layout === 'horizontal';

      let tableContent: string;
      if (isHoriz) {
        const itemsHtml = block.data.items.map((item) => {
          const icon = escapeHtml(item.icon || '•');
          const text = escapeHtml(item.text || '');
          const sub = item.subtitle ? `<div style="color: ${subCol}; font-size: ${subSz}px; font-family: ${txtFont}; line-height: 1.4; margin-top: 2px;">${escapeHtml(item.subtitle)}</div>` : '';
          return `<td style="padding: 0 ${gap / 2}px 0 0; vertical-align: top;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="width: ${iconSz + 4}px; text-align: center; vertical-align: ${sub ? 'top' : 'middle'}; font-size: ${iconSz}px; color: ${iconCol}; line-height: 1; padding-top: ${sub ? '2px' : '0'};">${icon}</td>
    <td style="padding-left: 10px; vertical-align: top;">
      <span style="color: ${txtCol}; font-size: ${txtSz}px; font-family: ${txtFont}; font-weight: ${txtWt}; line-height: 1.4;">${text}</span>
      ${sub}
    </td>
  </tr></table>
</td>`;
        }).join('\n');
        tableContent = `<tr>${itemsHtml}</tr>`;
      } else {
        tableContent = block.data.items.map((item) => {
          const icon = escapeHtml(item.icon || '•');
          const text = escapeHtml(item.text || '');
          const sub = item.subtitle ? `<div style="color: ${subCol}; font-size: ${subSz}px; font-family: ${txtFont}; line-height: 1.4; margin-top: 2px;">${escapeHtml(item.subtitle)}</div>` : '';
          return `<tr><td style="padding-bottom: ${gap}px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="width: ${iconSz + 4}px; text-align: center; vertical-align: ${sub ? 'top' : 'middle'}; font-size: ${iconSz}px; color: ${iconCol}; line-height: 1; padding-top: ${sub ? '2px' : '0'};">${icon}</td>
    <td style="padding-left: 10px; vertical-align: top;">
      <span style="color: ${txtCol}; font-size: ${txtSz}px; font-family: ${txtFont}; font-weight: ${txtWt}; line-height: 1.4;">${text}</span>
      ${sub}
    </td>
  </tr></table>
</td></tr>`;
        }).join('\n');
      }

      return `<tr>
  <td style="padding: ${listPad}; background-color: ${listBg}; text-align: ${listAlign};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" ${isHoriz ? '' : 'width="100%"'} ${isHoriz ? `align="${listAlign}"` : ''}>
      ${tableContent}
    </table>
  </td>
</tr>`;
    }

    case 'profile': {
      const profPad = paddingStr(block.style.padding);
      const profBg = block.style.backgroundColor || '#ffffff';
      const profRadius = block.style.borderRadius ?? 12;
      const profBW = block.style.borderWidth ?? 1;
      const profBC = block.style.borderColor || '#e2e8f0';
      const profBS = block.style.borderStyle || 'solid';
      const profBorder = profBW > 0 ? `${profBW}px ${profBS} ${profBC}` : 'none';
      const imgSize = block.style.imageSize ?? 72;
      const imgRadius = block.style.imageBorderRadius ?? 50;
      const imgPos = block.style.imagePosition || 'left';
      const profAlign = block.style.contentAlignment || 'left';
      const nColor = block.style.nameColor || '#0f172a';
      const nSize = block.style.nameFontSize || 18;
      const nFont = block.style.nameFontFamily || font;
      const nWeight = block.style.nameFontWeight || 700;
      const rColor = block.style.roleColor || '#6366f1';
      const rSize = block.style.roleFontSize || 13;
      const bColor = block.style.bioColor || '#64748b';
      const bSize = block.style.bioFontSize || 14;
      const bFont = block.style.bioFontFamily || font;

      const imgSrc = escapeHtml(block.data.imageSrc);
      const imgAlt = escapeHtml(block.data.imageAlt);
      const pName = escapeHtml(block.data.name);
      const pRole = escapeHtml(block.data.role);
      const pBio = escapeHtml(block.data.bio);

      let badgeHtml = '';
      if (block.data.showBadge && block.data.badgeText) {
        const bdBg = block.style.badgeBackgroundColor || '#eef2ff';
        const bdCol = block.style.badgeTextColor || '#4338ca';
        badgeHtml = `<div style="margin-bottom: 4px;"><span style="display: inline-block; padding: 2px 8px; border-radius: 10px; background-color: ${bdBg}; color: ${bdCol}; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; font-family: ${font};">${escapeHtml(block.data.badgeText)}</span></div>`;
      }

      const roleHtml = pRole ? `<div style="color: ${rColor}; font-size: ${rSize}px; font-family: ${bFont}; font-weight: 600; line-height: 1.3; margin-top: 2px;">${pRole}</div>` : '';
      const bioHtml = pBio ? `<div style="color: ${bColor}; font-size: ${bSize}px; font-family: ${bFont}; line-height: 1.5; margin-top: 6px;">${pBio}</div>` : '';
      const imgHtml = imgSrc ? `<img src="${imgSrc}" alt="${imgAlt}" width="${imgSize}" height="${imgSize}" style="border-radius: ${imgRadius}%; display: block;" />` : '';

      let innerHtml: string;
      if (imgPos === 'top') {
        innerHtml = `<td style="text-align: ${profAlign};">
          ${imgHtml ? `<div style="margin: 0 auto 12px; width: ${imgSize}px;">${imgHtml}</div>` : ''}
          ${badgeHtml}
          <div style="color: ${nColor}; font-size: ${nSize}px; font-family: ${nFont}; font-weight: ${nWeight}; line-height: 1.3;">${pName}</div>
          ${roleHtml}
          ${bioHtml}
        </td>`;
      } else {
        const imgTd = `<td style="width: ${imgSize}px; vertical-align: top;">${imgHtml}</td>`;
        const textTd = `<td style="vertical-align: top; padding-left: 16px; text-align: left;">
          ${badgeHtml}
          <div style="color: ${nColor}; font-size: ${nSize}px; font-family: ${nFont}; font-weight: ${nWeight}; line-height: 1.3;">${pName}</div>
          ${roleHtml}
          ${bioHtml}
        </td>`;
        innerHtml = imgPos === 'right' ? `${textTd}${imgTd}` : `${imgTd}${textTd}`;
      }

      return `<tr>
  <td style="padding: ${profPad};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${profBg}; border-radius: ${profRadius}px; border: ${profBorder};">
      <tr>
        <td style="padding: ${profPad};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"${imgPos === 'top' ? '' : ' width="100%"'}>
            <tr>${innerHtml}</tr>
          </table>
        </td>
      </tr>
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

const SOCIAL_SVGS: Record<string, { color: string; path: string }> = {
  facebook:  { color: '#1877F2', path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.049 1.528.098v3.325h-1.248c-1.703 0-2.244.817-2.244 2.339v1.796h3.337l-.573 3.667h-2.764v8.199C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
  twitter:   { color: '#000000', path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  instagram: { color: '#E4405F', path: 'M7.03.084c-1.277.06-2.149.264-2.913.558a5.886 5.886 0 0 0-2.126 1.384A5.886 5.886 0 0 0 .607 4.152C.314 4.916.11 5.788.05 7.065.006 7.979 0 8.29 0 12.004c0 3.713.006 4.024.05 4.939.06 1.277.264 2.149.558 2.913.306.789.718 1.459 1.384 2.126A5.886 5.886 0 0 0 4.152 23.4c.764.294 1.636.498 2.913.558C7.979 23.994 8.29 24 12.004 24c3.713 0 4.024-.006 4.939-.05 1.277-.06 2.149-.264 2.913-.558a5.886 5.886 0 0 0 2.126-1.384 5.886 5.886 0 0 0 1.384-2.126c.294-.764.498-1.636.558-2.913.044-.915.05-1.226.05-4.939 0-3.713-.006-4.024-.05-4.939-.06-1.277-.264-2.149-.558-2.913a5.886 5.886 0 0 0-1.384-2.126A5.886 5.886 0 0 0 19.861.647C19.097.353 18.225.149 16.948.089 16.033.044 15.722.039 12.008.039h-.01zm-.884 2.167h.888c3.652 0 4.084.013 5.527.08 1.333.061 2.057.284 2.539.472.638.248 1.093.544 1.571 1.022.479.478.775.934 1.023 1.571.188.482.412 1.207.472 2.539.067 1.443.081 1.876.081 5.526s-.014 4.084-.08 5.527c-.061 1.333-.285 2.057-.473 2.539a4.232 4.232 0 0 1-1.023 1.571 4.232 4.232 0 0 1-1.571 1.022c-.482.188-1.206.412-2.539.472-1.443.067-1.875.081-5.527.081s-4.084-.014-5.527-.08c-1.333-.061-2.057-.285-2.539-.473a4.232 4.232 0 0 1-1.571-1.023 4.232 4.232 0 0 1-1.023-1.571c-.188-.482-.411-1.206-.472-2.539-.067-1.443-.08-1.875-.08-5.527s.013-4.084.08-5.527c.061-1.333.284-2.057.472-2.539.248-.638.544-1.093 1.022-1.571a4.232 4.232 0 0 1 1.571-1.022c.482-.188 1.207-.412 2.539-.472 1.264-.057 1.754-.074 4.311-.076v.003zm8.552 1.996a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88zM12.004 5.838a6.166 6.166 0 1 0 0 12.332 6.166 6.166 0 0 0 0-12.332zm0 2.167a4 4 0 1 1 0 8 4 4 0 0 1 0-8z' },
  linkedin:  { color: '#0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  youtube:   { color: '#FF0000', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  tiktok:    { color: '#000000', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
};

function socialIconDataUri(platform: string): string {
  const icon = SOCIAL_SVGS[platform];
  if (!icon) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${icon.color}"><path d="${icon.path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
