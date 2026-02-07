import { create } from 'zustand';
import type { ThemeMode, Variable } from '../types/editor';

interface ConfigState {
  apiKey: string;
  sessionToken: string;
  variables: Variable[];
  showLogo: boolean;
  showExportHtmlButton: boolean;
  themeMode: ThemeMode;
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
  plan: 'free',
  maxUploadSize: 5 * 1024 * 1024,
  maxMediaFilesPerUpload: 5,
  storageUsed: 0,
  storageLimit: 100 * 1024 * 1024,

  setConfig: (config) => set(config),
}));
