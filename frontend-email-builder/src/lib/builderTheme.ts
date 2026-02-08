import type { TemplateBackgroundStyle } from '../types/blocks';

export type BuilderTheme = 'light-breeze' | 'light-paper' | 'dark-slate' | 'dark-cosmos';

interface BuilderThemePreset {
  id: BuilderTheme;
  chromeMode: 'light' | 'dark';
  canvasBackgroundStyle: TemplateBackgroundStyle;
  canvasBackgroundColor: string;
  shellClassName: string;
}

const PRESETS: Record<BuilderTheme, BuilderThemePreset> = {
  'light-breeze': {
    id: 'light-breeze',
    chromeMode: 'light',
    canvasBackgroundStyle: 'aurora',
    canvasBackgroundColor: '#e7ecff',
    shellClassName: 'theme-preset-light-breeze',
  },
  'light-paper': {
    id: 'light-paper',
    chromeMode: 'light',
    canvasBackgroundStyle: 'paper-rings',
    canvasBackgroundColor: '#f8f6f1',
    shellClassName: 'theme-preset-light-paper',
  },
  'dark-slate': {
    id: 'dark-slate',
    chromeMode: 'dark',
    canvasBackgroundStyle: 'midnight-grid',
    canvasBackgroundColor: '#0f172a',
    shellClassName: 'theme-preset-dark-slate',
  },
  'dark-cosmos': {
    id: 'dark-cosmos',
    chromeMode: 'dark',
    canvasBackgroundStyle: 'sunset-glow',
    canvasBackgroundColor: '#1e1b2e',
    shellClassName: 'theme-preset-dark-cosmos',
  },
};

export function resolveBuilderTheme(value: unknown): BuilderTheme {
  if (value === 'light-breeze' || value === 'light-paper' || value === 'dark-slate' || value === 'dark-cosmos') {
    return value;
  }
  return 'light-breeze';
}

export function getBuilderThemePreset(value: unknown): BuilderThemePreset {
  const id = resolveBuilderTheme(value);
  return PRESETS[id];
}

