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
    fallbackColor: '#f4f4f4',
    canvasBackground: '#f4f4f4',
    emailBackground: '#f4f4f4',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    description: 'Soft cinematic gradient ribbons',
    fallbackColor: '#e7ecff',
    canvasBackground:
      'radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.25), transparent 45%), radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.25), transparent 42%), linear-gradient(135deg, #f6f7ff 0%, #e0e7ff 45%, #dbeafe 100%)',
    emailBackground:
      'radial-gradient(circle at 15% 15%, rgba(168, 85, 247, 0.22), transparent 45%), radial-gradient(circle at 85% 20%, rgba(14, 165, 233, 0.22), transparent 42%), linear-gradient(135deg, #f6f7ff 0%, #e0e7ff 45%, #dbeafe 100%)',
  },
  {
    id: 'sunset-glow',
    label: 'Sunset Glow',
    description: 'Warm ambient gradient with soft depth',
    fallbackColor: '#fdf1e8',
    canvasBackground:
      'radial-gradient(circle at 78% 18%, rgba(251, 113, 133, 0.26), transparent 42%), radial-gradient(circle at 22% 78%, rgba(251, 191, 36, 0.24), transparent 48%), linear-gradient(145deg, #fff7ed 0%, #fee2e2 48%, #ffedd5 100%)',
    emailBackground:
      'radial-gradient(circle at 78% 18%, rgba(251, 113, 133, 0.22), transparent 42%), radial-gradient(circle at 22% 78%, rgba(251, 191, 36, 0.2), transparent 48%), linear-gradient(145deg, #fff7ed 0%, #fee2e2 48%, #ffedd5 100%)',
  },
  {
    id: 'mint-weave',
    label: 'Mint Weave',
    description: 'Subtle woven pattern over cool tones',
    fallbackColor: '#eafbf6',
    canvasBackground:
      'repeating-linear-gradient(45deg, rgba(15, 118, 110, 0.07) 0, rgba(15, 118, 110, 0.07) 1px, transparent 1px, transparent 16px), repeating-linear-gradient(-45deg, rgba(20, 184, 166, 0.07) 0, rgba(20, 184, 166, 0.07) 1px, transparent 1px, transparent 16px), linear-gradient(135deg, #f0fdfa 0%, #dcfce7 100%)',
    emailBackground:
      'repeating-linear-gradient(45deg, rgba(15, 118, 110, 0.05) 0, rgba(15, 118, 110, 0.05) 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, rgba(20, 184, 166, 0.05) 0, rgba(20, 184, 166, 0.05) 1px, transparent 1px, transparent 18px), linear-gradient(135deg, #f0fdfa 0%, #dcfce7 100%)',
  },
  {
    id: 'midnight-grid',
    label: 'Midnight Grid',
    description: 'Dark editorial gradient with a fine grid',
    fallbackColor: '#0f172a',
    canvasBackground:
      'linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.22), transparent 36%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)',
    emailBackground:
      'linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px), radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.18), transparent 36%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.16), transparent 34%), linear-gradient(135deg, #0f172a 0%, #111827 55%, #1e293b 100%)',
  },
  {
    id: 'paper-rings',
    label: 'Paper Rings',
    description: 'Elegant neutral rings for premium layouts',
    fallbackColor: '#f8f6f1',
    canvasBackground:
      'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.12) 0, rgba(120, 113, 108, 0.12) 1px, transparent 1px), radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.16) 0, rgba(148, 163, 184, 0.16) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(148, 163, 184, 0.12) 0, rgba(148, 163, 184, 0.12) 2px, transparent 2px), linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)',
    emailBackground:
      'radial-gradient(circle at 10% 10%, rgba(120, 113, 108, 0.08) 0, rgba(120, 113, 108, 0.08) 1px, transparent 1px), radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.12) 0, rgba(148, 163, 184, 0.12) 2px, transparent 2px), radial-gradient(circle at 30% 80%, rgba(148, 163, 184, 0.1) 0, rgba(148, 163, 184, 0.1) 2px, transparent 2px), linear-gradient(140deg, #fafaf9 0%, #f5f5f4 52%, #e7e5e4 100%)',
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
    label: 'Mesh Blue',
    description: 'Soft geometric cool-tone mesh',
    fallbackColor: '#eef4ff',
    canvasBackground:
      'radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.12), transparent 42%), radial-gradient(circle at 84% 20%, rgba(14, 165, 233, 0.1), transparent 38%), linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #e5edff 100%)',
    emailBackground:
      'radial-gradient(circle at 18% 16%, rgba(59, 130, 246, 0.09), transparent 42%), radial-gradient(circle at 84% 20%, rgba(14, 165, 233, 0.08), transparent 38%), linear-gradient(145deg, #f8fbff 0%, #eef4ff 48%, #e5edff 100%)',
  },
  {
    id: 'aurora-soft',
    label: 'Aurora Soft',
    description: 'Pastel aurora glow for modern campaigns',
    fallbackColor: '#f2f3ff',
    canvasBackground:
      'radial-gradient(circle at 15% 10%, rgba(168, 85, 247, 0.14), transparent 36%), radial-gradient(circle at 85% 24%, rgba(34, 211, 238, 0.12), transparent 34%), linear-gradient(150deg, #fcfcff 0%, #f2f3ff 45%, #ebf6ff 100%)',
    emailBackground:
      'radial-gradient(circle at 15% 10%, rgba(168, 85, 247, 0.11), transparent 36%), radial-gradient(circle at 85% 24%, rgba(34, 211, 238, 0.1), transparent 34%), linear-gradient(150deg, #fcfcff 0%, #f2f3ff 45%, #ebf6ff 100%)',
  },
  {
    id: 'sunset-paper',
    label: 'Sunset Paper',
    description: 'Warm premium paper-like gradient',
    fallbackColor: '#fff5ef',
    canvasBackground:
      'radial-gradient(circle at 74% 20%, rgba(251, 146, 60, 0.15), transparent 40%), radial-gradient(circle at 20% 78%, rgba(251, 113, 133, 0.1), transparent 40%), linear-gradient(145deg, #fffaf7 0%, #fff1e8 55%, #fee4dc 100%)',
    emailBackground:
      'radial-gradient(circle at 74% 20%, rgba(251, 146, 60, 0.11), transparent 40%), radial-gradient(circle at 20% 78%, rgba(251, 113, 133, 0.08), transparent 40%), linear-gradient(145deg, #fffaf7 0%, #fff1e8 55%, #fee4dc 100%)',
  },
  {
    id: 'carbon-grid',
    label: 'Carbon Grid',
    description: 'Dark subtle grid for high-contrast content',
    fallbackColor: '#111827',
    canvasBackground:
      'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)',
    emailBackground:
      'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)',
  },
  {
    id: 'opal-rings',
    label: 'Opal Rings',
    description: 'Elegant neutral circles with gentle texture',
    fallbackColor: '#f7f7f5',
    canvasBackground:
      'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.1) 0, rgba(120,113,108,0.1) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(148,163,184,0.12) 0, rgba(148,163,184,0.12) 2px, transparent 2px), linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)',
    emailBackground:
      'radial-gradient(circle at 14% 14%, rgba(120,113,108,0.07) 0, rgba(120,113,108,0.07) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(148,163,184,0.1) 0, rgba(148,163,184,0.1) 2px, transparent 2px), linear-gradient(140deg, #fcfcfb 0%, #f7f7f5 56%, #efefeb 100%)',
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
