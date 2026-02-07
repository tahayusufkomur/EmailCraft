export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PricingPlan {
  plan: PlanKey;
  monthly_price_usd: number;
  rendered_emails_limit: number;
  storage_limit_bytes: number;
  max_upload_size_bytes: number;
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
  rendered_emails_count: number;
  rendered_emails_limit: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  created_at: string;
}

export interface SiteUser {
  id: number;
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
  storage_used_bytes: number;
  storage_limit_bytes: number;
  stripe_subscription_id: string | null;
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

export interface TemplateDetail extends TemplateListItem {
  json_data: Record<string, unknown>;
}

export interface SubscribeResponse {
  status?: string;
  plan?: PlanKey;
  checkout_url?: string;
  session_id?: string;
}
