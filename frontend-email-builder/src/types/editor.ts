export interface Variable {
  key: string;
  label: string;
  defaultValue?: string;
  type?: 'text' | 'url';
}

export interface EditorConfig {
  apiKey: string;
  variables: Variable[];
  plan: string;
  maxUploadSize: number;
  storageUsed: number;
  storageLimit: number;
}
