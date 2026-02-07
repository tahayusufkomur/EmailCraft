import { create } from 'zustand';
import type { Variable } from '../types/editor';

interface ConfigState {
  apiKey: string;
  sessionToken: string;
  variables: Variable[];
  plan: string;
  maxUploadSize: number;
  storageUsed: number;
  storageLimit: number;

  setConfig: (config: Partial<ConfigState>) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  apiKey: '',
  sessionToken: '',
  variables: [],
  plan: 'free',
  maxUploadSize: 5 * 1024 * 1024,
  storageUsed: 0,
  storageLimit: 100 * 1024 * 1024,

  setConfig: (config) => set(config),
}));
