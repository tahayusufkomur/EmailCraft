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
    max_media_files_per_upload: number;
    storage_used_bytes: number;
    storage_limit_bytes: number;
    rendered_emails_count: number;
    rendered_emails_limit: number;
    widget_context?: {
      show_logo?: boolean;
      show_export_html_button?: boolean;
      theme_mode?: 'light' | 'dark' | 'system';
      builder_theme?: 'light-breeze' | 'light-paper' | 'dark-slate' | 'dark-cosmos';
      email_background_style?: 'none' | 'aurora' | 'sunset-glow' | 'mint-weave' | 'midnight-grid' | 'paper-rings';
      email_background_color?: string;
    };
  };
}

export interface TemplateListItem {
  id: string;
  name: string;
  thumbnail_url: string | null;
  category: string;
  is_draft: boolean;
  template_type?: 'user' | 'provided';
  created_at: string;
  updated_at: string;
}

export interface PresignResponse {
  upload_url: string;
  file_url: string;
  image_id: string;
  kind: 'original' | 'thumbnail';
  expires_at: string | null;
}

export interface UploadedImageItem {
  id: string;
  url: string;
  filename: string;
  thumbnail_url: string | null;
  file_size: number;
  content_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface UploadImageResponse {
  file_url: string;
  thumbnail_url: string | null;
}

export interface MediaListResponse {
  results: UploadedImageItem[];
  total: number;
  has_more: boolean;
  next_offset: number | null;
  limit: number;
  offset: number;
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
