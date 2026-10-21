import type { CSSProperties } from 'react';

import type { TemplateBackgroundStyle, TemplateBodyBackgroundStyle } from '../types/blocks';

interface BackgroundStylePreset {
  id: TemplateBackgroundStyle;
  label: string;
  description: string;
  fallbackColor: string;
  canvasBackground: string;
  emailBackground: string;
}

interface BodyBackgroundStylePreset {
  id: TemplateBodyBackgroundStyle;
  label: string;
  description: string;
  fallbackColor: string;
  canvasBackground: string;
  emailBackground: string;
}

export const BACKGROUND_STYLE_PRESETS: BackgroundStylePreset[] = [
  {
    id: 'none',
    label: 'Solid',
    description: 'Simple solid background color',
    fallbackColor: '#f5f4f0',
    canvasBackground: '#f5f4f0',
    emailBackground: '#f5f4f0',
  },
  {
    id: 'aurora',
    label: 'Warm Linen',
    description: 'Soft architectural stone gradient',
    fallbackColor: '#f5f3ee',
    canvasBackground:
      'radial-gradient(circle at 15% 15%, rgba(143, 99, 36, 0.08), transparent 45%), radial-gradient(circle at 85% 20%, rgba(120, 113, 108, 0.08), transparent 42%), linear-gradient(135deg, #faf9f6 0%, #f3f1ec 50%, #ebe8e1 100%)',
    emailBackground:
      'radial-gradient(circle at 15% 15%, rgba(143, 99, 36, 0.08), transparent 45%), radial-gradient(circle at 85% 20%, rgba(120, 113, 108, 0.08), transparent 42%), linear-gradient(135deg, #faf9f6 0%, #f3f1ec 50%, #ebe8e1 100%)',
  },
  {
    id: 'sunset-glow',
    label: 'Sunset Glow',
    description: 'Warm ambient gradient with soft depth',
    fallbackColor: '#fdf1e8',
    canvasBackground:
      'radial-gradient(circle at 78% 18%, rgba(212, 163, 89, 0.18), transparent 42%), radial-gradient(circle at 22% 78%, rgba(180, 83, 9, 0.12), transparent 48%), linear-gradient(145deg, #fffaf5 0%, #f7efe6 48%, #f2e7da 100%)',
    emailBackground:
      'radial-gradient(circle at 78% 18%, rgba(212, 163, 89, 0.16), transparent 42%), radial-gradient(circle at 22% 78%, rgba(180, 83, 9, 0.1), transparent 48%), linear-gradient(145deg, #fffaf5 0%, #f7efe6 48%, #f2e7da 100%)',
  },
  {
    id: 'mint-weave',
    label: 'Mint Weave',
    description: 'Subtle woven pattern over sage tones',
    fallbackColor: '#f2f5f2',
    canvasBackground:
      'repeating-linear-gradient(45deg, rgba(22, 101, 52, 0.04) 0, rgba(22, 101, 52, 0.04) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, rgba(22, 101, 52, 0.04) 0, rgba(22, 101, 52, 0.04) 1px, transparent 1px, transparent 16px), linear-gradient(135deg, #f7f9f7 0%, #eef2ee 100%)',
    emailBackground:
      'repeating-linear-gradient(45deg, rgba(22, 101, 52, 0.04) 0, rgba(22, 101, 52, 0.04) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(22, 101, 52, 0.04) 0, rgba(22, 101, 52, 0.04) 1px, transparent 1px, transparent 18px), linear-gradient(135deg, #f7f9f7 0%, #eef2ee 100%)',
  },
  {
    id: 'midnight-grid',
    label: 'Obsidian Grid',
    description: 'Dark editorial gradient with a fine grid',
    fallbackColor: '#141311',
    canvasBackground:
      'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px), radial-gradient(circle at 20% 20%, rgba(212, 163, 89, 0.1), transparent 36%), radial-gradient(circle at 80% 80%, rgba(143, 99, 36, 0.1), transparent 34%), linear-gradient(135deg, #11100e 0%, #161513 55%, #1e1d1a 100%)',
    emailBackground:
      'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px), radial-gradient(circle at 20% 20%, rgba(212, 163, 89, 0.08), transparent 36%), radial-gradient(circle at 80% 80%, rgba(143, 99, 36, 0.08), transparent 34%), linear-gradient(135deg, #11100e 0%, #161513 55%, #1e1d1a 100%)',
  },
  {
    id: 'paper-rings',
    label: 'Paper Rings',
    description: 'Elegant neutral rings for premium layouts',
    fallbackColor: '#f8f6f1',
    canvasBackground:
      'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.12) 0, rgba(120, 113, 108, 0.12) 1px, transparent 1px), radial-gradient(circle at 70% 30%, rgba(120, 113, 108, 0.14) 0, rgba(120, 113, 108, 0.14) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(120, 113, 108, 0.1) 0, rgba(120, 113, 108, 0.1) 2px, transparent 2px), linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)',
    emailBackground:
      'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0.08) 1px, transparent 1px), radial-gradient(circle at 70% 30%, rgba(120, 113, 108, 0.1) 0, rgba(120, 113, 108, 0.1) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0.08) 2px, transparent 2px), linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)',
  },
];

export const BODY_BACKGROUND_STYLE_PRESETS: BodyBackgroundStylePreset[] = [
  {
    id: 'solid',
    label: 'Solid',
    description: 'Clean single-color content background',
    fallbackColor: '#ffffff',
    canvasBackground: '#ffffff',
    emailBackground: '#ffffff',
  },
  {
    id: 'mesh-blue',
    label: 'Warm Mist',
    description: 'Soft editorial stone mesh',
    fallbackColor: '#f7f6f3',
    canvasBackground:
      'radial-gradient(circle at 18% 16%, rgba(143, 99, 36, 0.08), transparent 42%), radial-gradient(circle at 84% 20%, rgba(120, 113, 108, 0.08), transparent 38%), linear-gradient(145deg, #ffffff 0%, #f8f7f4 48%, #f1efea 100%)',
    emailBackground:
      'radial-gradient(circle at 18% 16%, rgba(143, 99, 36, 0.06), transparent 42%), radial-gradient(circle at 84% 20%, rgba(120, 113, 108, 0.06), transparent 38%), linear-gradient(145deg, #ffffff 0%, #f8f7f4 48%, #f1efea 100%)',
  },
  {
    id: 'aurora-soft',
    label: 'Ivory Glow',
    description: 'Subtle warm ivory glow for modern campaigns',
    fallbackColor: '#faf8f5',
    canvasBackground:
      'radial-gradient(circle at 15% 10%, rgba(212, 163, 89, 0.12), transparent 36%), radial-gradient(circle at 85% 24%, rgba(120, 113, 108, 0.08), transparent 34%), linear-gradient(150deg, #ffffff 0%, #faf8f5 45%, #f4f1ea 100%)',
    emailBackground:
      'radial-gradient(circle at 15% 10%, rgba(212, 163, 89, 0.09), transparent 36%), radial-gradient(circle at 85% 24%, rgba(120, 113, 108, 0.06), transparent 34%), linear-gradient(150deg, #ffffff 0%, #faf8f5 45%, #f4f1ea 100%)',
  },
  {
    id: 'sunset-paper',
    label: 'Sunset Paper',
    description: 'Warm premium paper-like gradient',
    fallbackColor: '#fff7f0',
    canvasBackground:
      'radial-gradient(circle at 74% 20%, rgba(212, 163, 89, 0.14), transparent 40%), radial-gradient(circle at 20% 78%, rgba(180, 83, 9, 0.08), transparent 40%), linear-gradient(145deg, #fffcf9 0%, #fcf4ec 55%, #f7eadc 100%)',
    emailBackground:
      'radial-gradient(circle at 74% 20%, rgba(212, 163, 89, 0.1), transparent 40%), radial-gradient(circle at 20% 78%, rgba(180, 83, 9, 0.06), transparent 40%), linear-gradient(145deg, #fffcf9 0%, #fcf4ec 55%, #f7eadc 100%)',
  },
  {
    id: 'carbon-grid',
    label: 'Carbon Grid',
    description: 'Dark subtle grid for high-contrast content',
    fallbackColor: '#161513',
    canvasBackground:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(135deg, #141311 0%, #1a1917 60%, #22201d 100%)',
    emailBackground:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(135deg, #141311 0%, #1a1917 60%, #22201d 100%)',
  },
  {
    id: 'opal-rings',
    label: 'Opal Rings',
    description: 'Elegant neutral circles with gentle texture',
    fallbackColor: '#f7f7f5',
    canvasBackground:
      'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.1) 0, rgba(120,113,108,0.1) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(120,113,108,0.1) 0, rgba(120,113,108,0.1) 2px, transparent 2px), linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)',
    emailBackground:
      'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.07) 0, rgba(120,113,108,0.07) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(120,113,108,0.08) 0, rgba(120,113,108,0.08) 2px, transparent 2px), linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)',
  },
];

const PRESET_BY_ID: Record<TemplateBackgroundStyle, BackgroundStylePreset> = BACKGROUND_STYLE_PRESETS
  .reduce((accumulator, preset) => {
    accumulator[preset.id] = preset;
    return accumulator;
  }, {} as Record<TemplateBackgroundStyle, BackgroundStylePreset>);
const BODY_PRESET_BY_ID: Record<TemplateBodyBackgroundStyle, BodyBackgroundStylePreset> = BODY_BACKGROUND_STYLE_PRESETS
  .reduce((accumulator, preset) => {
    accumulator[preset.id] = preset;
    return accumulator;
  }, {} as Record<TemplateBodyBackgroundStyle, BodyBackgroundStylePreset>);

const CSS_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgba?\([\d.\s,%]+\)$|^hsla?\([\d.\s,%]+\)$/;

export function resolveTemplateBackgroundStyle(
  style: TemplateBackgroundStyle | string | undefined | null,
): TemplateBackgroundStyle {
  if (!style || typeof style !== 'string') return 'none';
  if (style in PRESET_BY_ID) return style as TemplateBackgroundStyle;
  return 'none';
}

export function resolveTemplateBodyBackgroundStyle(
  style: TemplateBodyBackgroundStyle | string | undefined | null,
): TemplateBodyBackgroundStyle {
  if (!style || typeof style !== 'string') return 'solid';
  if (style in BODY_PRESET_BY_ID) return style as TemplateBodyBackgroundStyle;
  return 'solid';
}

export function getBackgroundStylePreset(
  style: TemplateBackgroundStyle | string | undefined | null,
): BackgroundStylePreset {
  return PRESET_BY_ID[resolveTemplateBackgroundStyle(style)];
}

export function getBodyBackgroundStylePreset(
  style: TemplateBodyBackgroundStyle | string | undefined | null,
): BodyBackgroundStylePreset {
  return BODY_PRESET_BY_ID[resolveTemplateBodyBackgroundStyle(style)];
}

export function resolveBackgroundColor(
  color: string | undefined,
  style: TemplateBackgroundStyle | string | undefined | null,
): string {
  const preset = getBackgroundStylePreset(style);
  const normalized = (color || '').trim();
  if (!normalized) return preset.fallbackColor;
  if (CSS_COLOR_PATTERN.test(normalized)) return normalized;
  return preset.fallbackColor;
}

function resolveBackgroundColorWithFallback(
  color: string | undefined,
  fallbackColor: string,
): string {
  const normalized = (color || '').trim();
  if (!normalized) return fallbackColor;
  if (CSS_COLOR_PATTERN.test(normalized)) return normalized;
  return fallbackColor;
}

export function getCanvasBackgroundStyle(
  style: TemplateBackgroundStyle | string | undefined | null,
  color: string | undefined,
): CSSProperties {
  const preset = getBackgroundStylePreset(style);
  const fallbackColor = resolveBackgroundColor(color, style);

  if (preset.id === 'none') {
    return { background: fallbackColor };
  }

  return {
    backgroundColor: fallbackColor,
    backgroundImage: preset.canvasBackground,
    backgroundSize: preset.id === 'midnight-grid' ? '28px 28px, 28px 28px, auto, auto, auto' : 'auto',
    backgroundPosition: 'center',
  };
}

export function getEmailBackgroundCss(
  style: TemplateBackgroundStyle | string | undefined | null,
  color: string | undefined,
): { backgroundColor: string; background: string } {
  const preset = getBackgroundStylePreset(style);
  const backgroundColor = resolveBackgroundColor(color, style);

  if (preset.id === 'none') {
    return { backgroundColor, background: backgroundColor };
  }

  return {
    backgroundColor,
    background: preset.emailBackground,
  };
}

export function getEmailBodyBackgroundCss(
  style: TemplateBodyBackgroundStyle | string | undefined | null,
  color: string | undefined,
): { backgroundColor: string; background: string } {
  const preset = getBodyBackgroundStylePreset(style);
  const backgroundColor = resolveBackgroundColorWithFallback(color, preset.fallbackColor);

  if (preset.id === 'solid') {
    return { backgroundColor, background: backgroundColor };
  }

  return {
    backgroundColor,
    background: preset.emailBackground,
  };
}

export function getCanvasBodyBackgroundStyle(
  style: TemplateBodyBackgroundStyle | string | undefined | null,
  color: string | undefined,
): CSSProperties {
  const preset = getBodyBackgroundStylePreset(style);
  const fallbackColor = resolveBackgroundColorWithFallback(color, preset.fallbackColor);

  if (preset.id === 'solid') {
    return { background: fallbackColor };
  }

  return {
    backgroundColor: fallbackColor,
    backgroundImage: preset.canvasBackground,
    backgroundSize: preset.id === 'carbon-grid' ? '26px 26px, 26px 26px, auto' : 'auto',
  };
}
