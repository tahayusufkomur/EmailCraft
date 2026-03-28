import type { EmailTemplate, Block } from '../types/blocks';
import type { ColorPalette } from './colorPalettes';

/**
 * Calculate relative luminance of a hex color (0 = black, 1 = white).
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Derive button text color: white on dark primary, textDark on light primary.
 */
function deriveButtonText(palette: ColorPalette): string {
  return luminance(palette.primary) < 0.5 ? '#ffffff' : palette.textDark;
}

/**
 * Apply 80% opacity to a hex color by appending alpha.
 */
function withOpacity80(hex: string): string {
  return hex.length === 7 ? hex + 'cc' : hex;
}

/**
 * Classify a background color and return the palette slot to apply.
 */
function classifyBackground(bgColor: string | null | undefined): 'white' | 'neutral' | 'custom' {
  if (!bgColor || bgColor === 'transparent') return 'white';
  try {
    const lum = luminance(bgColor);
    if (lum > 0.95) return 'white';
    if (lum > 0.85) return 'neutral';
    return 'custom';
  } catch {
    return 'custom';
  }
}

function recolorBlock(block: Block, palette: ColorPalette): Block {
  const updated = { ...block, style: { ...block.style } };
  const buttonText = deriveButtonText(palette);

  // Recolor block background based on luminance classification
  const bgClass = classifyBackground(updated.style.backgroundColor as string | null);
  if (bgClass === 'white') {
    updated.style = { ...updated.style, backgroundColor: palette.background };
  } else if (bgClass === 'neutral') {
    updated.style = { ...updated.style, backgroundColor: palette.surface };
  }

  switch (block.type) {
    case 'heading':
      updated.style = { ...updated.style, color: palette.textDark };
      break;

    case 'button':
      updated.style = {
        ...updated.style,
        backgroundColor: palette.primary,
        color: buttonText,
        borderColor: palette.primary,
      };
      break;

    case 'hero':
      updated.style = {
        ...updated.style,
        headingColor: palette.background,
        subheadingColor: withOpacity80(palette.background),
        buttonBackgroundColor: palette.primary,
        buttonTextColor: buttonText,
        overlayColor: palette.secondary,
      };
      break;

    case 'divider':
      updated.style = { ...updated.style, lineColor: palette.surface };
      break;

    case 'columns':
      updated.data = {
        ...block.data,
        columns: block.data.columns.map((col: { id: string; blocks: Block[]; backgroundColor?: string | null }) => {
          const colBgClass = classifyBackground(col.backgroundColor);
          let newBg = col.backgroundColor;
          if (colBgClass === 'white') newBg = palette.background;
          else if (colBgClass === 'neutral') newBg = palette.surface;
          return {
            ...col,
            backgroundColor: newBg,
            blocks: col.blocks.map((b: Block) => recolorBlock(b, palette)),
          };
        }),
      };
      break;
  }

  return updated;
}

function recolorBlocks(blocks: Block[], palette: ColorPalette): Block[] {
  return blocks.map((b) => recolorBlock(b, palette));
}

export function recolorTemplate(template: EmailTemplate, palette: ColorPalette): EmailTemplate {
  return {
    ...template,
    settings: {
      ...template.settings,
      defaultColor: palette.textDark,
      bodyBackgroundColor: palette.background,
    },
    header: { ...template.header, blocks: recolorBlocks(template.header.blocks, palette) },
    body: { ...template.body, blocks: recolorBlocks(template.body.blocks, palette) },
    footer: { ...template.footer, blocks: recolorBlocks(template.footer.blocks, palette) },
  };
}
