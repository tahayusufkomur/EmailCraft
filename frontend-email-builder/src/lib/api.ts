import type {
  ExportResponse,
  MediaListResponse,
  PresignResponse,
  RenderRequest,
  RenderResponse,
  SessionResponse,
  TemplateListItem,
  UploadImageResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
type MediaSortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

function resolveApiKey(): string {
  const storageKey = 'mailcraft_api_key';
  const fromStorage = localStorage.getItem(storageKey) || '';

  if (typeof window === 'undefined') return fromStorage;

  const fromQuery = new URLSearchParams(window.location.search).get('apiKey') || '';
  if (fromQuery && fromQuery !== fromStorage) {
    localStorage.setItem(storageKey, fromQuery);
    return fromQuery;
  }

  return fromStorage;
}

function resolveSessionToken(): string {
  const storageKey = 'mailcraft_session_token';
  const fromStorage = localStorage.getItem(storageKey) || '';

  if (typeof window === 'undefined') return fromStorage;

  const fromQuery = new URLSearchParams(window.location.search).get('sessionToken') || '';
  if (fromQuery && fromQuery !== fromStorage) {
    localStorage.setItem(storageKey, fromQuery);
    return fromQuery;
  }

  return fromStorage;
}

async function uploadBinaryToPresignedUrl(url: string, contentType: string, body: Blob): Promise<void> {
  const uploadResponse = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Upload failed with status ${uploadResponse.status}`);
  }
}

async function createThumbnailBlob(file: File): Promise<Blob | null> {
  if (!file.type.startsWith('image/')) return null;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = objectUrl;
    });

    const maxDimension = 360;
    const largestDimension = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = largestDimension > maxDimension ? maxDimension / largestDimension : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;

    context.drawImage(image, 0, 0, width, height);
    const thumbnailBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82);
    });
    return thumbnailBlob;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const sessionToken = resolveSessionToken();
  const apiKey = resolveApiKey();

  const authHeaders: Record<string, string> = {};
  if (sessionToken) {
    authHeaders['X-Session-Token'] = sessionToken;
  } else if (apiKey) {
    authHeaders['X-API-Key'] = apiKey;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
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

  saveTemplate: (data: { name: string; json_data: object; category?: string; is_draft?: boolean }) =>
    request<{ id: string }>('/templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTemplate: (id: string, data: { name?: string; json_data?: object; category?: string }) =>
    request<{ id: string }>(`/templates/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTemplate: (id: string) =>
    request<void>(`/templates/${id}/`, { method: 'DELETE' }),

  getGallery: (category?: string) =>
    request<{ data: TemplateListItem[] }>(`/gallery${category ? `?category=${category}` : ''}`),

  listMedia: (params?: { q?: string; sort?: MediaSortField; order?: SortOrder; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    const query = params?.q?.trim();
    if (query) searchParams.set('q', query);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (typeof params?.limit === 'number') searchParams.set('limit', String(params.limit));
    if (typeof params?.offset === 'number') searchParams.set('offset', String(params.offset));
    const suffix = searchParams.toString();
    return request<MediaListResponse>(`/media${suffix ? `?${suffix}` : ''}`);
  },

  getPresignedUrl: (
    data: {
      filename: string;
      content_type: string;
      file_size: number;
      kind?: 'original' | 'thumbnail';
      image_id?: string;
      upload_batch_size?: number;
    },
  ) =>
    request<PresignResponse>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadImage: async (file: File, options?: { uploadBatchSize?: number }): Promise<UploadImageResponse> => {
    const presigned = await request<PresignResponse>('/upload/presign', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
        file_size: file.size,
        kind: 'original',
        upload_batch_size: options?.uploadBatchSize ?? 1,
      }),
    });

    await uploadBinaryToPresignedUrl(presigned.upload_url, file.type, file);

    let thumbnailUrl: string | null = null;
    const thumbnailBlob = await createThumbnailBlob(file);
    if (thumbnailBlob) {
      const thumbnailPresigned = await request<PresignResponse>('/upload/presign', {
        method: 'POST',
        body: JSON.stringify({
          filename: `thumb_${file.name}`,
          content_type: thumbnailBlob.type || 'image/jpeg',
          file_size: thumbnailBlob.size,
          kind: 'thumbnail',
          image_id: presigned.image_id,
        }),
      });
      await uploadBinaryToPresignedUrl(
        thumbnailPresigned.upload_url,
        thumbnailBlob.type || 'image/jpeg',
        thumbnailBlob,
      );
      thumbnailUrl = thumbnailPresigned.file_url;
    }

    return { file_url: presigned.file_url, thumbnail_url: thumbnailUrl };
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
