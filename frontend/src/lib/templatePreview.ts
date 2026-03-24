// Lightweight HTML renderer for gallery previews (client-side only).

type TemplateBackgroundStyle =
  | 'none'
  | 'aurora'
  | 'sunset-glow'
  | 'mint-weave'
  | 'midnight-grid'
  | 'paper-rings';

type TemplateBodyBackgroundStyle =
  | 'solid'
  | 'mesh-blue'
  | 'aurora-soft'
  | 'sunset-paper'
  | 'carbon-grid'
  | 'opal-rings';

interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface BlockStyle {
  padding?: Spacing;
  margin?: Spacing;
  backgroundColor?: string | null;
  backgroundGradient?: string | null;
  alignment?: 'left' | 'center' | 'right';
}

interface TextBlock {
  id: string;
  type: 'text';
  data: { html: string; variables?: string[] };
  style: BlockStyle;
}

interface ImageBlock {
  id: string;
  type: 'image';
  data: { src: string; alt: string; link?: string; width: number; height?: number };
  style: BlockStyle & { borderRadius?: number; fullWidth?: boolean };
}

interface ButtonBlock {
  id: string;
  type: 'button';
  data: { text: string; url: string };
  style: BlockStyle & {
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    fullWidth?: boolean;
    fontSize?: number;
    fontFamily?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    borderWidth?: number;
    fontWeight?: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    paddingX?: number;
    paddingY?: number;
  };
}

interface DividerBlock {
  id: string;
  type: 'divider';
  data: Record<string, never>;
  style: BlockStyle & {
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineColor?: string;
    lineThickness?: number;
    spacing?: number;
  };
}

interface Column {
  id: string;
  blocks: Block[];
  backgroundColor?: string | null;
}

interface ColumnsBlock {
  id: string;
  type: 'columns';
  data: {
    columnCount: 2 | 3;
    columnRatio: number[];
    columns: Column[];
  };
  style: BlockStyle & { gap?: number; stackOnMobile?: boolean };
}

interface SocialBlock {
  id: string;
  type: 'social';
  data: { platforms: { type: string; url: string }[] };
  style: BlockStyle & { iconSize?: number; layout?: 'horizontal' | 'vertical'; spacing?: number };
}

interface HeadingBlock {
  id: string;
  type: 'heading';
  data: { text: string; level: 1 | 2 | 3 | 4 };
  style: BlockStyle & {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
}

interface SpacerBlock {
  id: string;
  type: 'spacer';
  data: Record<string, never>;
  style: BlockStyle & { height?: number };
}

interface HtmlBlock {
  id: string;
  type: 'html';
  data: { html: string };
  style: BlockStyle;
}

interface HeroBlock {
  id: string;
  type: 'hero';
  data: {
    backgroundImage: string;
    heading: string;
    subheading: string;
    buttonText: string;
    buttonUrl: string;
  };
  style: BlockStyle & {
    height?: number;
    overlayColor?: string;
    overlayOpacity?: number;
    headingColor?: string;
    headingFontSize?: number;
    headingFontFamily?: string;
    subheadingColor?: string;
    buttonBackgroundColor?: string;
    buttonTextColor?: string;
    buttonBorderRadius?: number;
    contentAlignment?: 'left' | 'center' | 'right';
    verticalAlignment?: 'top' | 'center' | 'bottom';
  };
}

type Block =
  | TextBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | ColumnsBlock
  | SocialBlock
  | HeadingBlock
  | SpacerBlock
  | HtmlBlock
  | HeroBlock;

interface TemplateSettings {
  backgroundColor?: string;
  backgroundStyle?: TemplateBackgroundStyle;
  bodyBackgroundStyle?: TemplateBodyBackgroundStyle;
  bodyBackgroundColor?: string;
  bodyBorderRadius?: number;
  contentWidth?: number;
  defaultFont?: string;
  defaultFontSize?: number;
  defaultColor?: string;
}

export interface EmailTemplate {
  version: number;
  settings: TemplateSettings;
  header: { blocks: Block[] };
  body: { blocks: Block[] };
  footer: { blocks: Block[] };
}

const BACKGROUND_PRESETS: Record<TemplateBackgroundStyle, { fallback: string; background: string }> = {
  none: { fallback: '#f4f4f4', background: '#f4f4f4' },
  aurora: {
    fallback: '#e7ecff',
    background: 'radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.22), transparent 45%), radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.22), transparent 42%), linear-gradient(135deg, #f6f7ff 0%, #e0e7ff 45%, #dbeafe 100%)',
  },
  'sunset-glow': {
    fallback: '#fdf1e8',
    background: 'radial-gradient(circle at 78% 18%, rgba(251, 113, 133, 0.22), transparent 42%), radial-gradient(circle at 22% 78%, rgba(251, 191, 36, 0.2), transparent 48%), linear-gradient(145deg, #fff7ed 0%, #fee2e2 48%, #ffedd5 100%)',
  },
  'mint-weave': {
    fallback: '#eafbf6',
    background: 'repeating-linear-gradient(45deg, rgba(15, 118, 110, 0.05) 0, rgba(15, 118, 110, 0.05) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(20, 184, 166, 0.05) 0, rgba(20, 184, 166, 0.05) 1px, transparent 1px, transparent 18px), linear-gradient(135deg, #f0fdfa 0%, #dcfce7 100%)',
  },
  'midnight-grid': {
    fallback: '#0f172a',
    background: 'linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 36%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.16), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)',
  },
  'paper-rings': {
    fallback: '#f8f6f1',
    background: 'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0.08) 1px, transparent 1px), radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.12) 0, rgba(148, 163, 184, 0.12) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(148, 163, 184, 0.1) 0, rgba(148, 163, 184, 0.1) 2px, transparent 2px), linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)',
  },
};

const BODY_BACKGROUND_PRESETS: Record<TemplateBodyBackgroundStyle, { fallback: string; background: string }> = {
  solid: { fallback: '#ffffff', background: '#ffffff' },
  'mesh-blue': {
    fallback: '#eef4ff',
    background: 'radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.09), transparent 42%), radial-gradient(circle at 84% 20%, rgba(14, 165, 233, 0.08), transparent 38%), linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #e5edff 100%)',
  },
  'aurora-soft': {
    fallback: '#f2f3ff',
    background: 'radial-gradient(circle at 15% 10%, rgba(168, 85, 247, 0.11), transparent 36%), radial-gradient(circle at 85% 24%, rgba(34, 211, 238, 0.1), transparent 34%), linear-gradient(150deg, #fcfcff 0%, #f2f3ff 45%, #ebf6ff 100%)',
  },
  'sunset-paper': {
    fallback: '#fff5ef',
    background: 'radial-gradient(circle at 74% 20%, rgba(251, 146, 60, 0.11), transparent 40%), radial-gradient(circle at 20% 78%, rgba(251, 113, 133, 0.08), transparent 40%), linear-gradient(145deg, #fffaf7 0%, #fff1e8 55%, #fee4dc 100%)',
  },
  'carbon-grid': {
    fallback: '#111827',
    background: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)',
  },
  'opal-rings': {
    fallback: '#f7f7f5',
    background: 'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.07) 0, rgba(120,113,108,0.07) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(148,163,184,0.1) 0, rgba(148,163,184,0.1) 2px, transparent 2px), linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)',
  },
};

const GOOGLE_FONT_SLUGS: Record<string, string> = {
  'Noto Serif': 'Noto+Serif:wght@400;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@300;400;500;600;700',
  'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@300;400;500;600;700',
  Inter: 'Inter:wght@300;400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;700',
  Lora: 'Lora:wght@400;700',
  Montserrat: 'Montserrat:wght@300;400;500;600;700',
  'Open Sans': 'Open+Sans:wght@300;400;600;700',
  Raleway: 'Raleway:wght@300;400;500;600;700',
  Poppins: 'Poppins:wght@300;400;500;600;700',
  Roboto: 'Roboto:wght@300;400;500;700',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  'Source Serif 4': 'Source+Serif+4:wght@400;600;700',
  Merriweather: 'Merriweather:wght@400;700',
};

const SOCIAL_SVGS: Record<string, { color: string; path: string }> = {
  facebook: { color: '#1877F2', path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.049 1.528.098v3.325h-1.248c-1.703 0-2.244.817-2.244 2.339v1.796h3.337l-.573 3.667h-2.764v8.199C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
  twitter: { color: '#000000', path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z' },
  instagram: { color: '#E4405F', path: 'M7.03.084c-1.277.06-2.149.264-2.913.558a5.886 5.886 0 0 0-2.126 1.384A5.886 5.886 0 0 0 .607 4.152C.314 4.916.11 5.788.05 7.065.006 7.979 0 8.29 0 12.004c0 3.713.006 4.024.05 4.939.06 1.277.264 2.149.558 2.913.306.789.718 1.459 1.384 2.126A5.886 5.886 0 0 0 4.152 23.4c.764.294 1.636.498 2.913.558C7.979 23.994 8.29 24 12.004 24c3.713 0 4.024-.006 4.939-.05 1.277-.06 2.149-.264 2.913-.558a5.886 5.886 0 0 0 2.126-1.384 5.886 5.886 0 0 0 1.384-2.126c.294-.764.498-1.636.558-2.913.044-.915.05-1.226.05-4.939 0-3.713-.006-4.024-.05-4.939-.06-1.277-.264-2.149-.558-2.913a5.886 5.886 0 0 0-1.384-2.126A5.886 5.886 0 0 0 19.861.647C19.097.353 18.225.149 16.948.089 16.033.044 15.722.039 12.008.039h-.01zm-.884 2.167h.888c3.652 0 4.084.013 5.527.08 1.333.061 2.057.284 2.539.472.638.248 1.093.544 1.571 1.022.479.478.775.934 1.023 1.571.188.482.412 1.207.472 2.539.067 1.443.081 1.876.081 5.526s-.014 4.084-.08 5.527c-.061 1.333-.285 2.057-.473 2.539a4.232 4.232 0 0 1-1.023 1.571 4.232 4.232 0 0 1-1.571 1.022c-.482.188-1.206.412-2.539.472-1.443.067-1.875.081-5.527.081s-4.084-.014-5.527-.08c-1.333-.061-2.057-.285-2.539-.473a4.232 4.232 0 0 1-1.571-1.023 4.232 4.232 0 0 1-1.023-1.571c-.188-.482-.411-1.206-.472-2.539-.067-1.443-.08-1.875-.08-5.527s.013-4.084.08-5.527c.061-1.333.284-2.057.472-2.539.248-.638.544-1.093 1.022-1.571a4.232 4.232 0 0 1 1.571-1.022c.482-.188 1.207-.412 2.539-.472 1.264-.057 1.754-.074 4.311-.076v.003zm8.552 1.996a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88zM12.004 5.838a6.166 6.166 0 1 0 0 12.332 6.166 6.166 0 0 0 0-12.332zm0 2.167a4 4 0 1 1 0 8 4 4 0 0 1 0-8z' },
  linkedin: { color: '#0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  youtube: { color: '#FF0000', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  tiktok: { color: '#000000', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
};

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = (value || '').trim();
  if (!normalized) return fallback;
  return normalized;
}

function getEmailBackgroundCss(style: TemplateBackgroundStyle | undefined, color: string | undefined) {
  const preset = BACKGROUND_PRESETS[style || 'none'] ?? BACKGROUND_PRESETS.none;
  const backgroundColor = resolveColor(color, preset.fallback);
  if (style === 'none' || !style) {
    return { backgroundColor, background: backgroundColor };
  }
  return { backgroundColor, background: preset.background };
}

function getEmailBodyBackgroundCss(style: TemplateBodyBackgroundStyle | undefined, color: string | undefined) {
  const preset = BODY_BACKGROUND_PRESETS[style || 'solid'] ?? BODY_BACKGROUND_PRESETS.solid;
  const backgroundColor = resolveColor(color, preset.fallback);
  if (style === 'solid' || !style) {
    return { backgroundColor, background: backgroundColor };
  }
  return { backgroundColor, background: preset.background };
}

function collectFonts(template: EmailTemplate): string[] {
  const fonts = new Set<string>();
  if (template.settings.defaultFont) fonts.add(template.settings.defaultFont);

  const scanBlocks = (blocks: Block[]) => {
    for (const block of blocks) {
      const style = block.style as Record<string, unknown> | undefined;
      if (style?.fontFamily) fonts.add(String(style.fontFamily));
      if (style?.headingFontFamily) fonts.add(String(style.headingFontFamily));
      if (block.type === 'columns') {
        for (const col of block.data.columns) {
          scanBlocks(col.blocks);
        }
      }
    }
  };

  scanBlocks(template.header.blocks);
  scanBlocks(template.body.blocks);
  scanBlocks(template.footer.blocks);
  return Array.from(fonts);
}

function googleFontLinks(fonts: string[]): string {
  const names = new Set<string>();
  for (const ff of fonts) {
    for (const name of Object.keys(GOOGLE_FONT_SLUGS)) {
      if (ff.includes(name)) names.add(name);
    }
  }
  if (!names.size) return '';
  const families = Array.from(names).map((n) => GOOGLE_FONT_SLUGS[n]).join('&family=');
  return `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}

export function renderTemplatePreview(template: EmailTemplate): string {
  const settings = template.settings || {};
  const contentWidth = settings.contentWidth || 600;
  const emailBackground = getEmailBackgroundCss(settings.backgroundStyle, settings.backgroundColor);
  const emailBodyBackground = getEmailBodyBackgroundCss(settings.bodyBackgroundStyle, settings.bodyBackgroundColor);
  const headerHtml = renderBlocks(template.header.blocks, settings);
  const bodyHtml = renderBlocks(template.body.blocks, settings);
  const footerHtml = renderBlocks(template.footer.blocks, settings);
  const fontLinks = googleFontLinks(collectFonts(template));
  const radius = settings.bodyBorderRadius ? ` border-radius: ${settings.bodyBorderRadius}px; overflow: hidden;` : '';

  return `<!DOCTYPE html>\n<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <meta http-equiv="X-UA-Compatible" content="IE=edge">\n  <meta name="x-apple-disable-message-reformatting">\n  <title></title>\n  ${fontLinks}\n  <style>\n    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }\n    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }\n    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }\n    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }\n    @media only screen and (max-width: ${contentWidth + 20}px) {\n      .email-container { width: 100% !important; max-width: 100% !important; }\n      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }\n    }\n  </style>\n</head>\n<body style="margin: 0; padding: 0; background-color: ${emailBackground.backgroundColor}; background: ${emailBackground.background};">\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${emailBackground.backgroundColor}; background: ${emailBackground.background};">\n    <tr>\n      <td align="center" style="padding: 20px 0;">\n        <table role="presentation" class="email-container" width="${contentWidth}" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto; background-color: ${emailBodyBackground.backgroundColor}; background: ${emailBodyBackground.background};${radius}">\n          ${headerHtml}\n          ${bodyHtml}\n          ${footerHtml}\n        </table>\n      </td>\n    </tr>\n  </table>\n</body>\n</html>`;
}

function renderBlocks(blocks: Block[], settings: TemplateSettings): string {
  return blocks.map((block) => renderBlock(block, settings)).join('\n');
}

function renderBlock(block: Block, settings: TemplateSettings): string {
  const font = settings.defaultFont || 'Arial, Helvetica, sans-serif';
  const fontSize = settings.defaultFontSize || 14;
  const color = settings.defaultColor || '#333333';

  switch (block.type) {
    case 'text': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      const background = block.style.backgroundColor;
      const gradient = block.style.backgroundGradient;
      return `<tr>\n  <td style="padding: ${padding}; font-family: ${font}; font-size: ${fontSize}px; line-height: ${Math.round(fontSize * 1.6)}px; color: ${color}; text-align: ${align};${background ? ` background-color: ${background};` : ''}${gradient ? ` background: ${gradient};` : ''}">\n    ${block.data.html}\n  </td>\n</tr>`;
    }
    case 'image': {
      const isFullWidth = block.style.fullWidth || false;
      const padding = isFullWidth ? '0' : paddingStr(block.style.padding);
      const align = block.style.alignment || 'center';
      const src = escapeHtml(block.data.src || '');
      const alt = escapeHtml(block.data.alt || '');
      const width = isFullWidth ? (settings.contentWidth || 600) : (block.data.width || 600);
      const heightAttr = block.data.height ? ` height="${block.data.height}"` : '';
      const borderRadius = block.style.borderRadius || 0;
      const radiusStyle = borderRadius > 0 ? ` border-radius: ${borderRadius}px;` : '';
      let imgTag = `<img src="${src}" alt="${alt}" width="${width}"${heightAttr} style="display: block; max-width: 100%; height: auto; border: 0;${radiusStyle}" />`;
      if (block.data.link) {
        imgTag = `<a href="${escapeHtml(block.data.link)}" target="_blank" style="text-decoration: none;">${imgTag}</a>`;
      }
      return `<tr>\n  <td style="padding: ${padding};" align="${align}">\n    ${imgTag}\n  </td>\n</tr>`;
    }
    case 'button': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'center';
      const text = escapeHtml(block.data.text || '');
      const url = escapeHtml(block.data.url || '#');
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
      return `<tr>\n  <td style="padding: ${padding};" align="${align}">\n    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}"${widthAttr} style="${fullWidth ? 'width: 100%;' : ''}">\n      <tr>\n        <td style="border-radius: ${borderRadius}px; background-color: ${bgColor}; border: ${borderWidth}px ${borderStyle} ${borderColor};" align="center">\n          <a href="${url}" target="_blank" style="display: ${btnDisplay}; width: ${btnWidth}; box-sizing: border-box; padding: ${paddingY}px ${paddingX}px; background-color: ${bgColor}; color: ${textColor}; font-family: ${btnFont}; font-size: ${btnFontSize}px; font-weight: ${fontWeight}; letter-spacing: ${letterSpacing}px; text-transform: ${textTransform}; text-decoration: none; border-radius: ${borderRadius}px; border: ${borderWidth}px ${borderStyle} ${borderColor};">\n            ${text}\n          </a>\n        </td>\n      </tr>\n    </table>\n  </td>\n</tr>`;
    }
    case 'divider': {
      const lineStyle = block.style.lineStyle || 'solid';
      const lineColor = block.style.lineColor || '#cccccc';
      const thickness = block.style.lineThickness || 1;
      const spacing = block.style.spacing || 20;
      return `<tr>\n  <td style="padding: ${spacing}px 0;">\n    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n      <tr>\n        <td style="border-top: ${thickness}px ${lineStyle} ${lineColor}; font-size: 0; line-height: 0;" height="1">&nbsp;</td>\n      </tr>\n    </table>\n  </td>\n</tr>`;
    }
    case 'columns': {
      const colCount = block.data.columnCount || 2;
      const gap = block.style.gap || 10;
      const contentWidth = settings.contentWidth || 600;
      const defaultRatio = Math.floor(100 / colCount);
      const ratios = block.data.columnRatio.length === colCount ? block.data.columnRatio : Array.from({ length: colCount }, () => defaultRatio);
      const colsHtml = block.data.columns.map((col, index) => {
        const ratio = ratios[index] || defaultRatio;
        const colWidth = Math.floor((contentWidth - gap * (colCount - 1)) * (ratio / 100));
        const colContent = renderBlocks(col.blocks, settings);
        const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${colContent}</table>`;
        const stackClass = block.style.stackOnMobile === false ? '' : 'stack-column';
        const colBg = col.backgroundColor ? ` background-color: ${col.backgroundColor};` : '';
        return `<div class="${stackClass}" style="display: inline-block; width: 100%; max-width: ${colWidth}px; vertical-align: top;">\n        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n          <tr><td style="padding: 0 ${gap / 2}px;${colBg}">${inner}</td></tr>\n        </table>\n      </div>`;
      }).join('\n');
      return `<tr><td>${colsHtml}</td></tr>`;
    }
    case 'social': {
      const align = block.style.alignment || 'center';
      const iconSize = block.style.iconSize || 32;
      const spacing = block.style.spacing || 10;
      const iconsHtml = block.data.platforms.map((p) => {
        const url = escapeHtml(p.url || '#');
        const iconUrl = socialIconDataUri(p.type);
        return `<td style="padding: 0 ${spacing / 2}px;">\n      <a href="${url}" target="_blank">\n        <img src="${iconUrl}" alt="${p.type}" width="${iconSize}" height="${iconSize}" style="display: block; border: 0;" />\n      </a>\n    </td>`;
      }).join('\n');
      return `<tr>\n  <td align="${align}">\n    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}">\n      <tr>${iconsHtml}</tr>\n    </table>\n  </td>\n</tr>`;
    }
    case 'heading': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      const headingTag = `h${block.data.level || 2}`;
      const headingText = escapeHtml(block.data.text || '');
      const headingSize = block.style.fontSize || 28;
      const headingWeight = block.style.fontWeight || 700;
      const headingColor = block.style.color || color;
      const headingFont = block.style.fontFamily || font;
      const headingLetterSpacing = block.style.letterSpacing || 0;
      const headingTextTransform = block.style.textTransform || 'none';
      const background = block.style.backgroundColor;
      return `<tr>\n  <td style="padding: ${padding}; text-align: ${align};${background ? ` background-color: ${background};` : ''}">\n    <${headingTag} style="margin: 0; font-family: ${headingFont}; font-size: ${headingSize}px; line-height: ${Math.round(headingSize * 1.2)}px; color: ${headingColor}; font-weight: ${headingWeight};${headingLetterSpacing ? ` letter-spacing: ${headingLetterSpacing}px;` : ''}${headingTextTransform !== 'none' ? ` text-transform: ${headingTextTransform};` : ''}">\n      ${headingText}\n    </${headingTag}>\n  </td>\n</tr>`;
    }
    case 'spacer': {
      const height = Math.max(0, block.style.height || 0);
      const background = block.style.backgroundColor;
      return `<tr>\n  <td style="line-height: 0; font-size: 0; height: ${height}px;${background ? ` background-color: ${background};` : ''}">&nbsp;</td>\n</tr>`;
    }
    case 'html': {
      const padding = paddingStr(block.style.padding);
      const align = block.style.alignment || 'left';
      const background = block.style.backgroundColor;
      const gradient = block.style.backgroundGradient;
      return `<tr>\n  <td style="padding: ${padding}; text-align: ${align};${background ? ` background-color: ${background};` : ''}${gradient ? ` background: ${gradient};` : ''}">\n    ${block.data.html}\n  </td>\n</tr>`;
    }
    case 'hero': {
      const contentW = settings.contentWidth || 600;
      const bgImg = escapeHtml(block.data.backgroundImage || '');
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
      const heading = escapeHtml(block.data.heading || '');
      const sub = escapeHtml(block.data.subheading || '');
      const btnText = escapeHtml(block.data.buttonText || '');
      const btnUrl = escapeHtml(block.data.buttonUrl || '#');
      return `<tr>\n  <td background="${bgImg}" width="${contentW}" height="${h}" valign="${valignAttr}" style="background-image: url('${bgImg}'); background-size: cover; background-position: center; height: ${h}px;">\n    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="height: ${h}px;">\n      <tr>\n        <td style="background: linear-gradient(${gradDir}, ${overlayRgba} 60%, transparent 100%); padding: 32px; text-align: ${align};" valign="${valignAttr}">\n          <h1 style="margin: 0 0 8px; font-family: ${headingFont}; font-size: ${headingSize}px; line-height: ${Math.round(headingSize * 1.15)}px; color: ${headingColor}; font-weight: 700;">${heading}</h1>\n          ${sub ? `<p style=\"margin: 0 0 20px; font-family: ${font}; font-size: ${fontSize}px; color: ${subColor}; line-height: 1.5;\">${sub}</p>` : ''}\n          ${btnText ? `<a href=\"${btnUrl}\" target=\"_blank\" style=\"display: inline-block; padding: 14px 32px; background-color: ${btnBg}; color: ${btnColor}; font-family: ${font}; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: ${btnRadius}px;\">${btnText}</a>` : ''}\n        </td>\n      </tr>\n    </table>\n  </td>\n</tr>`;
    }
    default:
      return '';
  }
}

function paddingStr(padding?: Spacing): string {
  if (!padding) return '0';
  return `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;');
}

function socialIconDataUri(platform: string): string {
  const icon = SOCIAL_SVGS[platform];
  if (!icon) return '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${icon.color}"><path d="${icon.path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
