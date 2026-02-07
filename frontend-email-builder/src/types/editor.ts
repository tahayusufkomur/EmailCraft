export interface Variable {
  key: string;
  label: string;
  defaultValue?: string;
  type?: 'text' | 'url';
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface WidgetContext {
  showLogo?: boolean;
  showExportHtmlButton?: boolean;
  themeMode?: ThemeMode;
}

export interface EditorConfig {
  apiKey: string;
  variables: Variable[];
  plan: string;
  maxUploadSize: number;
  maxMediaFilesPerUpload: number;
  storageUsed: number;
  storageLimit: number;
  context?: WidgetContext;
}
