import { create } from 'zustand';
import type { ThemeMode, Variable } from '../types/editor';
import type { TemplateBackgroundStyle } from '../types/blocks';

interface ConfigState {
  apiKey: string;
  sessionToken: string;
  variables: Variable[];
  showLogo: boolean;
  showExportHtmlButton: boolean;
  themeMode: ThemeMode;
  builderTheme: 'light-breeze' | 'light-paper' | 'dark-slate' | 'dark-cosmos';
  emailBackgroundStyle: TemplateBackgroundStyle;
  emailBackgroundColor: string;
  chromeColor: string;
  canvasColor: string;
  plan: string;
  maxUploadSize: number;
  maxMediaFilesPerUpload: number;
  storageUsed: number;
  storageLimit: number;

  setConfig: (config: Partial<ConfigState>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  apiKey: '',
  sessionToken: '',
  variables: [],
  showLogo: true,
  showExportHtmlButton: true,
  themeMode: 'system',
  builderTheme: 'light-breeze',
  emailBackgroundStyle: 'none',
  emailBackgroundColor: '#f4f4f4',
  chromeColor: '',
  canvasColor: '',
  plan: 'free',
  maxUploadSize: 5 * 1024 * 1024,
  maxMediaFilesPerUpload: 5,
  storageUsed: 0,
  storageLimit: 100 * 1024 * 1024,

  setConfig: (config) => set(config),
}));
