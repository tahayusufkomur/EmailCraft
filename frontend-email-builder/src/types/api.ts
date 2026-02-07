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
    variables?: Array<{
      key: string;
      label: string;
      defaultValue?: string;
      type?: 'text' | 'url';
    }>;
    max_upload_size_bytes: number;
    storage_used_bytes: number;
    storage_limit_bytes: number;
    rendered_emails_count: number;
    rendered_emails_limit: number;
    widget_context?: {
      show_logo?: boolean;
      show_export_html_button?: boolean;
      theme_mode?: 'light' | 'dark' | 'system';
    };
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

export interface UploadedImageItem {
  id: string;
  url: string;
  filename: string;
  file_size: number;
  content_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface UploadImageResponse {
  file_url: string;
}

export interface ExportResponse {
  html: string;
  warnings: string[];
}

export interface RenderRequest {
  template_id?: string;
  json_data?: object;
  variables: Record<string, string>;
}

export interface RenderResponse {
  html: string;
  warnings: string[];
  variables_used: string[];
}
