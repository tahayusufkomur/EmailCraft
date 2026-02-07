export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface SessionResponse {
  token: string;
  expires_at: string;
  config: {
    plan: string;
    max_upload_size_bytes: number;
    storage_used_bytes: number;
    storage_limit_bytes: number;
  };
}

export interface TemplateListItem {
  id: string;
  name: string;
  thumbnail_url: string | null;
  category: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface PresignResponse {
  upload_url: string;
  file_url: string;
  expires_at: string | null;
}

export interface ExportResponse {
  html: string;
  warnings: string[];
}
