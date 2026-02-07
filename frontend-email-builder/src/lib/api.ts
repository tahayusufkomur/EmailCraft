import type {
  ExportResponse,
  PresignResponse,
  RenderRequest,
  RenderResponse,
  SessionResponse,
  TemplateListItem,
  UploadedImageItem,
  UploadImageResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
type MediaSortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = localStorage.getItem('mailcraft_api_key') || '';

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  createSession: (origin: string) =>
    request<SessionResponse>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ origin }),
    }),

  listTemplates: () =>
    request<{ results: TemplateListItem[] }>('/templates/'),

  getTemplate: (id: string) =>
    request<TemplateListItem & { json_data: object }>(`/templates/${id}/`),

  saveTemplate: (data: { name: string; json_data: object; is_draft?: boolean }) =>
    request<{ id: string }>('/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: { name?: string; json_data?: object }) =>
    request<{ id: string }>(`/templates/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    request<void>(`/templates/${id}/`, { method: 'DELETE' }),

  getGallery: (category?: string) =>
    request<{ data: TemplateListItem[] }>(`/gallery${category ? `?category=${category}` : ''}`),

  listMedia: (params?: { q?: string; sort?: MediaSortField; order?: SortOrder }) => {
    const searchParams = new URLSearchParams();
    const query = params?.q?.trim();
    if (query) searchParams.set('q', query);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    const suffix = searchParams.toString();
    return request<{ results: UploadedImageItem[] }>(`/media${suffix ? `?${suffix}` : ''}`);
  },

  getPresignedUrl: (data: { filename: string; content_type: string; file_size: number }) =>
    request<PresignResponse>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImage: async (file: File): Promise<UploadImageResponse> => {
    const presigned = await request<PresignResponse>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
      }),
    });

    const uploadResponse = await fetch(presigned.upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    return { file_url: presigned.file_url };
  },

  exportHtml: (data: { json_data: object; variables_mode?: string }) =>
    request<ExportResponse>('/export/html', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  renderTemplate: (data: RenderRequest) =>
    request<RenderResponse>('/render', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
