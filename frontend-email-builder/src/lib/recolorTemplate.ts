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
 * Classify a background color by luminance.
 * - white:  very light (lum > 0.85) → palette.background
 * - neutral: light gray (lum > 0.70) → palette.surface
 * - dark:   very dark  (lum < 0.15) → palette.secondary (dark accent)
 * - custom: everything else → unchanged
 */
function classifyBackground(bgColor: string | null | undefined): 'white' | 'neutral' | 'dark' | 'custom' {
  if (!bgColor || bgColor === 'transparent') return 'white';
  try {
    const lum = luminance(bgColor);
    if (lum > 0.85) return 'white';
    if (lum > 0.70) return 'neutral';
    if (lum < 0.15) return 'dark';
    return 'custom';
  } catch {
    return 'custom';
  }
}

/**
 * Check if a background color is dark (luminance < 0.25).
 */
function isDarkBackground(bgColor: string | null | undefined): boolean {
  if (!bgColor || bgColor === 'transparent') return false;
  try {
    return luminance(bgColor) < 0.25;
  } catch {
    return false;
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
  } else if (bgClass === 'dark') {
    updated.style = { ...updated.style, backgroundColor: palette.secondary };
  }

  // After recoloring, determine if this block sits on a dark background
  const onDark = isDarkBackground(updated.style.backgroundColor as string | null);

  switch (block.type) {
    case 'heading':
      updated.style = { ...updated.style, color: onDark ? palette.background : palette.textDark };
      break;

    case 'text':
      // Text blocks on dark backgrounds need light text color
      if (onDark) {
        updated.style = { ...updated.style, color: palette.background };
      }
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
      updated.style = { ...updated.style, lineColor: onDark ? palette.primary : palette.surface };
      break;

    case 'card':
      updated.style = {
        ...updated.style,
        headingColor: onDark ? palette.background : palette.textDark,
        bodyColor: onDark ? withOpacity80(palette.background) : palette.textLight,
        buttonBackgroundColor: palette.primary,
        buttonTextColor: buttonText,
        buttonBorderColor: palette.primary,
        badgeBackgroundColor: onDark ? palette.primary : palette.surface,
        badgeTextColor: onDark ? palette.background : palette.textDark,
      };
      break;

    case 'list':
      updated.style = {
        ...updated.style,
        iconColor: palette.primary,
        textColor: onDark ? palette.background : palette.textDark,
        subtitleColor: onDark ? withOpacity80(palette.background) : palette.textLight,
      };
      break;

    case 'profile':
      updated.style = {
        ...updated.style,
        nameColor: onDark ? palette.background : palette.textDark,
        roleColor: palette.primary,
        bioColor: onDark ? withOpacity80(palette.background) : palette.textLight,
        badgeBackgroundColor: onDark ? palette.primary : palette.surface,
        badgeTextColor: onDark ? palette.background : palette.textDark,
      };
      break;

    case 'columns':
      updated.data = {
        ...block.data,
        columns: block.data.columns.map((col: { id: string; blocks: Block[]; backgroundColor?: string | null }) => {
          const colBgClass = classifyBackground(col.backgroundColor);
          let newBg = col.backgroundColor;
          if (colBgClass === 'white') newBg = palette.background;
          else if (colBgClass === 'neutral') newBg = palette.surface;
          else if (colBgClass === 'dark') newBg = palette.secondary;
          return {
            ...col,
            backgroundColor: newBg,
            blocks: col.blocks.map((b: Block) => recolorBlock(b, palette)),
          };
        }),
      };
      break;
  }

  return updated as Block;
}

function recolorBlocks(blocks: Block[], palette: ColorPalette): Block[] {
  return blocks.map((b) => recolorBlock(b, palette));
}

export function recolorTemplate(template: EmailTemplate, palette: ColorPalette): EmailTemplate {
  // Determine outer background: if template had a dark outer bg, use palette.secondary
  const outerBgClass = classifyBackground(template.settings.backgroundColor);
  let newOuterBg = palette.background;
  if (outerBgClass === 'dark') newOuterBg = palette.secondary;

  return {
    ...template,
    settings: {
      ...template.settings,
      backgroundColor: newOuterBg,
      defaultColor: palette.textDark,
      bodyBackgroundColor: palette.background,
    },
    header: { ...template.header, blocks: recolorBlocks(template.header.blocks, palette) },
    body: { ...template.body, blocks: recolorBlocks(template.body.blocks, palette) },
    footer: { ...template.footer, blocks: recolorBlocks(template.footer.blocks, palette) },
  };
}
