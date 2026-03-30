import { useEffect, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, PLAN_ORDER, sortPlans } from '../lib/plans';
import type { PlanKey, PricingPlan, SiteDashboardResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { cn, formatBytes } from '../lib/utils';

function DowngradeWarning({ plan, dashboard, onConfirm, onCancel, busy }: {
  plan: PricingPlan;
  dashboard: SiteDashboardResponse;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const orgsToRemove = Math.max(0, dashboard.organizations_count - plan.max_organizations);
  const keysToRemove = Math.max(0, dashboard.active_api_keys_count - (plan.max_api_keys_per_org * plan.max_organizations));
  const hasImpact = orgsToRemove > 0 || keysToRemove > 0;

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-2">
          <p className="font-medium text-foreground">
            Downgrade to {PLAN_LABELS[plan.plan]}?
          </p>
          {hasImpact ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>After your current billing period ends, the following limits will apply:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Max {plan.max_organizations} organization{plan.max_organizations !== 1 ? 's' : ''} (you have {dashboard.organizations_count})</li>
                <li>Max {plan.max_api_keys_per_org} API key{plan.max_api_keys_per_org !== 1 ? 's' : ''} per org (you have {dashboard.active_api_keys_count} total)</li>
              </ul>
              {orgsToRemove > 0 && (
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  {orgsToRemove} organization{orgsToRemove !== 1 ? 's' : ''} will be deactivated. Only the oldest will remain.
                </p>
              )}
              {keysToRemove > 0 && (
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Extra API keys will be revoked. Only the oldest per org will remain.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your plan will change after the current billing period ends.
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={onConfirm} disabled={busy}>
              {busy ? 'Processing...' : 'Confirm downgrade'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardBillingPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [downgradePlan, setDowngradePlan] = useState<PricingPlan | null>(null);

  const fetchDashboard = () => {
    if (!token) return;
    void api
      .getDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(fetchDashboard, [token]);

  const planIndex = (key: PlanKey) => PLAN_ORDER.indexOf(key);

  const isDowngrade = (plan: PricingPlan) =>
    dashboard ? planIndex(plan.plan) < planIndex(dashboard.plan) : false;

  const handleSwitchPlan = async (plan: PricingPlan) => {
    if (!token) return;

    // Show confirmation for downgrades
    if (isDowngrade(plan) && !downgradePlan) {
      setDowngradePlan(plan);
      return;
    }

    setError(null);
    setDowngradePlan(null);
    setBusyPlan(plan.plan);
    try {
      const result = await api.subscribe(token, plan.plan);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      fetchDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!token) return;
    setBusyPlan('portal');
    setError(null);
    try {
      const result = await api.billingPortal(token);
      window.location.href = result.portal_url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const getButtonProps = (plan: PricingPlan) => {
    if (!dashboard) return { label: '', variant: 'outline' as const, disabled: true };

    const isCurrent = plan.plan === dashboard.plan;
    const isPending = plan.plan === dashboard.pending_plan;
    const isBusy = busyPlan === plan.plan;
    const upgrade = planIndex(plan.plan) > planIndex(dashboard.plan);
    const downgrade = planIndex(plan.plan) < planIndex(dashboard.plan);

    if (isCurrent && !dashboard.pending_plan) {
      return { label: 'Current plan', variant: 'outline' as const, disabled: true };
    }
    if (isCurrent && dashboard.pending_plan) {
      return { label: 'Keep current plan', variant: 'default' as const, disabled: false };
    }
    if (isPending) {
      return { label: 'Scheduled', variant: 'outline' as const, disabled: true };
    }
    if (isBusy) {
      return { label: 'Processing...', variant: 'outline' as const, disabled: true };
    }
    if (upgrade) {
      return { label: 'Upgrade', variant: 'default' as const, disabled: false };
    }
    if (downgrade) {
      return { label: 'Downgrade', variant: 'outline' as const, disabled: false };
    }
    return { label: 'Switch', variant: 'outline' as const, disabled: false };
  };

  const plans = dashboard ? sortPlans(dashboard.available_plans) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Current plan: <span className="font-medium text-foreground">{dashboard ? PLAN_LABELS[dashboard.plan] : '-'}</span>
        </p>
        {dashboard?.pending_plan && (
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
            Downgrade to {PLAN_LABELS[dashboard.pending_plan]} scheduled at the end of your current billing period.
          </p>
        )}
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {/* Downgrade confirmation */}
      {downgradePlan && dashboard && (
        <DowngradeWarning
          plan={downgradePlan}
          dashboard={dashboard}
          onConfirm={() => { void handleSwitchPlan(downgradePlan); }}
          onCancel={() => setDowngradePlan(null)}
          busy={busyPlan === downgradePlan.plan}
        />
      )}

      {dashboard && (
        <>
          {/* Usage stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rendered Emails</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {dashboard.rendered_emails_count.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {dashboard.rendered_emails_limit.toLocaleString()}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatBytes(dashboard.storage_used_bytes)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ {formatBytes(dashboard.storage_limit_bytes)}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{dashboard.organizations_count}</p>
              </CardContent>
            </Card>
          </div>

          {/* Plan cards */}
          <div>
            <h2 className="mb-4 font-heading text-xl font-semibold tracking-tight">Plans</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const isCurrent = plan.plan === dashboard.plan && !dashboard.pending_plan;
                const isPending = plan.plan === dashboard.pending_plan;
                const { label, variant, disabled } = getButtonProps(plan);

                return (
                  <Card
                    key={plan.plan}
                    className={cn(
                      isCurrent && 'border-primary/50 ring-1 ring-primary/20',
                      isPending && 'border-amber-500/50',
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{PLAN_LABELS[plan.plan]}</CardTitle>
                        {isCurrent && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            <Check className="h-3 w-3" /> Current
                          </span>
                        )}
                        {isPending && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-semibold">
                        ${plan.monthly_price_usd}<span className="text-sm font-normal text-muted-foreground"> / month</span>
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                      <p>{plan.rendered_emails_limit.toLocaleString()} emails / month</p>
                      <p>{formatBytes(plan.storage_limit_bytes)} storage</p>
                      <p>{formatBytes(plan.max_upload_size_bytes)} max upload</p>
                      <p>{plan.max_organizations} org{plan.max_organizations !== 1 ? 's' : ''} / {plan.max_api_keys_per_org} key{plan.max_api_keys_per_org !== 1 ? 's' : ''} per org</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={variant}
                        disabled={disabled}
                        onClick={() => { void handleSwitchPlan(plan); }}
                      >
                        {label}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Manage subscription link */}
          {dashboard.stripe_subscription_id && (
            <div>
              <Button
                variant="outline"
                onClick={() => { void handleManageSubscription(); }}
                disabled={busyPlan === 'portal'}
              >
                {busyPlan === 'portal' ? 'Opening...' : 'Manage subscription on Stripe'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
