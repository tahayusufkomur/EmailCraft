import type {
  LandingResponse,
  LoginResponse,
  PricingResponse,
  SiteDashboardResponse,
  SiteMeResponse,
  SiteRegisterResponse,
  SubscribeResponse,
  TemplateDetail,
  TemplateListItem,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body?.error?.message ||
      body?.detail ||
      (typeof body?.non_field_errors?.[0] === 'string' ? body.non_field_errors[0] : null) ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  fetchLanding: () => request<LandingResponse>('/pages/landing'),

  fetchPricing: () => request<PricingResponse>('/pages/pricing'),

  register: (payload: {
    username: string;
    email: string;
    password: string;
    organization_name: string;
  }) => request<SiteRegisterResponse>('/site/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  login: async (identifier: string, password: string) => {
    const data = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: identifier, email: identifier, password }),
    });

    const token = data.key || data.token;
    if (!token) {
      throw new Error('Login succeeded but no token was returned.');
    }

    return token;
  },

  logout: (token: string) =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({}) }, token),

  getMe: (token: string) => request<SiteMeResponse>('/site/me', {}, token),

  getDashboard: (token: string) => request<SiteDashboardResponse>('/site/dashboard', {}, token),

  listTemplates: (token: string) => request<{ results: TemplateListItem[] }>('/site/templates/', {}, token),

  getTemplate: (token: string, id: string) => request<TemplateDetail>(`/site/templates/${id}/`, {}, token),

  createTemplate: (
    token: string,
    payload: { name: string; json_data: Record<string, unknown>; category?: string; is_draft?: boolean },
  ) => request<TemplateDetail>('/site/templates/', { method: 'POST', body: JSON.stringify(payload) }, token),

  updateTemplate: (
    token: string,
    id: string,
    payload: { name?: string; json_data?: Record<string, unknown>; category?: string; is_draft?: boolean },
  ) => request<TemplateDetail>(`/site/templates/${id}/`, { method: 'PUT', body: JSON.stringify(payload) }, token),

  deleteTemplate: (token: string, id: string) => request<void>(`/site/templates/${id}/`, { method: 'DELETE' }, token),

  subscribe: (token: string, plan: 'free' | 'starter' | 'pro' | 'enterprise') =>
    request<SubscribeResponse>('/site/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }, token),
};
