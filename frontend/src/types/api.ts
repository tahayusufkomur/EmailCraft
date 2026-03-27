export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';
export type ThemeMode = 'light' | 'dark' | 'system';
export type VariableType = 'text' | 'url';
export type BuilderTheme = 'light-breeze' | 'light-paper' | 'dark-slate' | 'dark-cosmos';
export type EmailBackgroundStyle = 'none' | 'aurora' | 'sunset-glow' | 'mint-weave' | 'midnight-grid' | 'paper-rings';

export interface OrganizationVariable {
  key: string;
  label: string;
  defaultValue?: string;
  type?: VariableType;
}

export interface PricingPlan {
  plan: PlanKey;
  monthly_price_usd: number;
  rendered_emails_limit: number;
  storage_limit_bytes: number;
  max_upload_size_bytes: number;
  max_media_files_per_upload: number;
}

export interface PricingResponse {
  currency: string;
  billing_cycle: string;
  plans: PricingPlan[];
  stripe_public_key: string;
}

export interface LandingResponse {
  hero: {
    title: string;
    subtitle: string;
  };
  features: string[];
  cta: {
    pricing_path: string;
    subscribe_path: string;
  };
}

export interface OrganizationSummary {
  id: string;
  name: string;
  email: string;
  plan: PlanKey;
  allowed_origins: string[];
  available_variables: OrganizationVariable[];
  show_logo: boolean;
  show_export_html_button: boolean;
  theme_mode: ThemeMode;
  builder_theme: BuilderTheme;
  email_background_style: EmailBackgroundStyle;
  email_background_color: string;
  rendered_emails_count: number;
  rendered_emails_limit: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  created_at: string;
}

export interface ApiKeySummary {
  id: string;
  key_prefix: string;
  environment: 'live' | 'test';
  scope: 'full' | 'readonly';
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface OrganizationWithApiKeys extends OrganizationSummary {
  api_keys: ApiKeySummary[];
}

export interface SiteUser {
  username: string;
  email: string;
}

export interface SiteRegisterResponse {
  token: string;
  user: SiteUser;
  organization: OrganizationSummary;
}

export interface LoginResponse {
  key?: string;
  token?: string;
}

export interface SiteMeResponse {
  user: SiteUser;
  organization: OrganizationSummary;
}

export interface SiteDashboardResponse {
  plan: PlanKey;
  rendered_emails_count: number;
  rendered_emails_limit: number;
  max_media_files_per_upload: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  organizations_count: number;
  stripe_subscription_id: string | null;
}

export interface SiteOrganizationsResponse {
  results: OrganizationWithApiKeys[];
}

export interface SiteOrganizationCreateResponse {
  organization: OrganizationWithApiKeys;
  created_api_key?: {
    raw: string;
    item: ApiKeySummary;
  };
}

export interface SiteApiKeyCreateResponse {
  raw: string;
  item: ApiKeySummary;
  refreshed: boolean;
}

export interface TemplateListItem {
  id: string;
  name: string;
  thumbnail_url: string | null;
  category: string;
  is_draft: boolean;
  is_premium?: boolean;
  tags?: string[];
  template_type?: 'user' | 'provided';
  created_at: string;
  updated_at: string;
}

export interface TemplateDetail extends TemplateListItem {
  json_data: Record<string, unknown>;
}

export interface GalleryTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  json_data: Record<string, unknown>;
  is_premium?: boolean;
  tags?: string[];
  template_type?: 'provided';
}

export interface GalleryTemplatesResponse {
  data: GalleryTemplate[];
}

export interface SubscribeResponse {
  status?: string;
  plan?: PlanKey;
  checkout_url?: string;
  session_id?: string;
}

export interface GuestCheckoutResponse {
  checkout_url: string;
}

export interface MagicLinkResponse {
  status: string;
}

export interface BillingPortalResponse {
  portal_url: string;
}
