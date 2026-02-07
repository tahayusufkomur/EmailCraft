import type {
  LandingResponse,
  PricingResponse,
  SiteApiKeyCreateResponse,
  SiteDashboardResponse,
  SiteMeResponse,
  SiteOrganizationCreateResponse,
  SiteOrganizationsResponse,
  SiteRegisterResponse,
  SubscribeResponse,
  ThemeMode,
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
    const data = await request<{ token: string }>('/site/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (!data.token) {
      throw new Error('Login succeeded but no token was returned.');
    }

    return data.token;
  },

  logout: (token: string) =>
    request('/site/logout', { method: 'POST', body: JSON.stringify({}) }, token),

  getMe: (token: string) => request<SiteMeResponse>('/site/me', {}, token),

  getDashboard: (token: string) => request<SiteDashboardResponse>('/site/dashboard', {}, token),

  listOrganizations: (token: string) =>
    request<SiteOrganizationsResponse>('/site/organizations/', {}, token),

  createOrganization: (
    token: string,
    payload: {
      name: string;
      allowed_origins?: string[];
      show_logo?: boolean;
      show_export_html_button?: boolean;
      theme_mode?: ThemeMode;
    },
  ) =>
    request<SiteOrganizationCreateResponse>(
      '/site/organizations/',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    ),

  updateOrganization: (
    token: string,
    id: string,
    payload: {
      name?: string;
      allowed_origins?: string[];
      show_logo?: boolean;
      show_export_html_button?: boolean;
      theme_mode?: ThemeMode;
    },
  ) =>
    request<SiteOrganizationCreateResponse['organization']>(
      `/site/organizations/${id}/`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token,
    ),

  createOrganizationApiKey: (
    token: string,
    id: string,
    payload?: { refresh?: boolean },
  ) =>
    request<SiteApiKeyCreateResponse>(
      `/site/organizations/${id}/api-keys`,
      { method: 'POST', body: JSON.stringify(payload || {}) },
      token,
    ),

  subscribe: (token: string, plan: 'free' | 'starter' | 'pro' | 'enterprise') =>
    request<SubscribeResponse>('/site/billing/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    }, token),
};
