import type { EmailTemplate, Block } from '../types/blocks';
import type { ColorPalette } from './colorPalettes';

/**
 * Calculate relative luminance of a hex color (0 = black, 1 = white).
 */
function luminance(hex: string): number {
  const h = hex.replace('#', '').substring(0, 6);
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
 * Derive contrast-aware text colors from a palette.
 * Works for both light palettes (white bg, dark text) and dark palettes (dark bg, light text).
 */
function deriveTextColors(palette: ColorPalette) {
  const bgIsLight = luminance(palette.background) > 0.5;
  return {
    // Text for elements on light backgrounds
    onLightHeading: bgIsLight ? palette.textDark : palette.background,
    onLightBody: bgIsLight ? palette.textLight : withOpacity80(palette.background),
    // Text for elements on dark backgrounds
    onDarkHeading: bgIsLight ? palette.background : palette.textDark,
    onDarkBody: bgIsLight ? withOpacity80(palette.background) : palette.textLight,
  };
}

/**
 * Classify a background color by luminance — full coverage, no gaps.
 * - light:  lum >= 0.4  → palette.background or palette.surface
 * - dark:   lum < 0.4   → palette.secondary
 */
function classifyBackground(bgColor: string | null | undefined): 'white' | 'neutral' | 'dark' {
  if (!bgColor || bgColor === 'transparent') return 'white';
  try {
    const lum = luminance(bgColor);
    if (lum > 0.7) return 'white';
    if (lum >= 0.4) return 'neutral';
    return 'dark';
  } catch {
    return 'white';
  }
}

function isDarkBackground(bgColor: string | null | undefined): boolean {
  if (!bgColor || bgColor === 'transparent') return false;
  try {
    return luminance(bgColor) < 0.4;
  } catch {
    return false;
  }
}

function recolorBlock(block: Block, palette: ColorPalette, text: ReturnType<typeof deriveTextColors>): Block {
  const updated = { ...block, style: { ...block.style } };
  const buttonText = deriveButtonText(palette);

  // Recolor block background
  const bgClass = classifyBackground(updated.style.backgroundColor as string | null);
  if (bgClass === 'white') {
    updated.style = { ...updated.style, backgroundColor: palette.background };
  } else if (bgClass === 'neutral') {
    updated.style = { ...updated.style, backgroundColor: palette.surface };
  } else {
    updated.style = { ...updated.style, backgroundColor: palette.secondary };
  }

  const onDark = isDarkBackground(updated.style.backgroundColor as string | null);

  switch (block.type) {
    case 'heading':
      updated.style = { ...updated.style, color: onDark ? text.onDarkHeading : text.onLightHeading };
      break;

    case 'text':
      if (onDark) {
        updated.style = { ...updated.style, color: text.onDarkHeading };
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
        headingColor: text.onDarkHeading,
        subheadingColor: text.onDarkBody,
        buttonBackgroundColor: palette.primary,
        buttonTextColor: buttonText,
        overlayColor: palette.secondary,
      };
      break;

    case 'divider':
      updated.style = { ...updated.style, lineColor: onDark ? palette.primary : palette.surface };
      break;

    case 'card': {
      const cardStyle = updated.style as Record<string, unknown>;
      const iconBgClass = classifyBackground(cardStyle.iconBackgroundColor as string | null);
      const newIconBg = iconBgClass === 'dark' ? palette.secondary : iconBgClass === 'neutral' ? palette.surface : palette.background;
      updated.style = {
        ...updated.style,
        headingColor: onDark ? text.onDarkHeading : text.onLightHeading,
        bodyColor: onDark ? text.onDarkBody : text.onLightBody,
        buttonBackgroundColor: palette.primary,
        buttonTextColor: buttonText,
        buttonBorderColor: palette.primary,
        badgeBackgroundColor: onDark ? palette.primary : palette.surface,
        badgeTextColor: onDark ? text.onDarkHeading : text.onLightHeading,
        iconBackgroundColor: newIconBg,
      };
      break;
    }

    case 'list': {
      const listStyle = updated.style as Record<string, unknown>;
      const listIconBgClass = classifyBackground(listStyle.iconBackgroundColor as string | null);
      const newListIconBg = listIconBgClass === 'dark' ? palette.secondary : listIconBgClass === 'neutral' ? palette.surface : palette.background;
      updated.style = {
        ...updated.style,
        iconColor: palette.primary,
        iconBackgroundColor: newListIconBg,
        textColor: onDark ? text.onDarkHeading : text.onLightHeading,
        subtitleColor: onDark ? text.onDarkBody : text.onLightBody,
      };
      break;
    }

    case 'profile':
      updated.style = {
        ...updated.style,
        nameColor: onDark ? text.onDarkHeading : text.onLightHeading,
        roleColor: palette.primary,
        bioColor: onDark ? text.onDarkBody : text.onLightBody,
        badgeBackgroundColor: onDark ? palette.primary : palette.surface,
        badgeTextColor: onDark ? text.onDarkHeading : text.onLightHeading,
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
          else newBg = palette.secondary;
          return {
            ...col,
            backgroundColor: newBg,
            blocks: col.blocks.map((b: Block) => recolorBlock(b, palette, text)),
          };
        }),
      };
      break;
  }

  return updated as Block;
}

function recolorBlocks(blocks: Block[], palette: ColorPalette, text: ReturnType<typeof deriveTextColors>): Block[] {
  return blocks.map((b) => recolorBlock(b, palette, text));
}

export function recolorTemplate(template: EmailTemplate, palette: ColorPalette): EmailTemplate {
  const text = deriveTextColors(palette);

  const outerBgClass = classifyBackground(template.settings.backgroundColor);
  let newOuterBg = palette.background;
  if (outerBgClass === 'dark') newOuterBg = palette.secondary;

  return {
    ...template,
    settings: {
      ...template.settings,
      backgroundColor: newOuterBg,
      defaultColor: text.onLightHeading,
      bodyBackgroundColor: palette.background,
    },
    header: { ...template.header, blocks: recolorBlocks(template.header.blocks, palette, text) },
    body: { ...template.body, blocks: recolorBlocks(template.body.blocks, palette, text) },
    footer: { ...template.footer, blocks: recolorBlocks(template.footer.blocks, palette, text) },
  };
}
