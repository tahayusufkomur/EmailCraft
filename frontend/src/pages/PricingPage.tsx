import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, PLAN_ORDER, sortPlans } from '../lib/plans';
import type { PlanKey, PricingPlan, SiteDashboardResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { cn, formatBytes } from '../lib/utils';

export function PricingPage() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .fetchPricing()
      .then((res) => setPlans(sortPlans(res.plans)))
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!token) return;
    void api.getDashboard(token).then(setDashboard).catch(() => {});
  }, [token]);

  const cards = useMemo(() => sortPlans(plans), [plans]);

  const planIndex = (key: PlanKey) => PLAN_ORDER.indexOf(key);

  const handleChoosePlan = async (plan: PricingPlan) => {
    setError(null);
    setBusyPlan(plan.plan);

    try {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      const result = await api.subscribe(token!, plan.plan);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      if (result.status === 'updated' || result.status === 'upgraded' || result.status === 'downgrade_scheduled' || result.status === 'downgrade_cancelled' || result.status === 'unchanged') {
        navigate('/dashboard/billing');
        return;
      }
      setError('Unexpected response from subscription.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const getButtonProps = (plan: PricingPlan) => {
    if (busyPlan === plan.plan) {
      return { label: 'Processing...', variant: 'outline' as const, disabled: true };
    }

    if (!isAuthenticated) {
      return {
        label: plan.monthly_price_usd === 0 ? 'Get started free' : 'Get started',
        variant: plan.plan === 'pro' ? 'default' as const : 'outline' as const,
        disabled: false,
      };
    }

    if (!dashboard) {
      return { label: 'Switch plan', variant: 'outline' as const, disabled: false };
    }

    const isCurrent = plan.plan === dashboard.plan;
    const isPending = plan.plan === dashboard.pending_plan;
    const isUpgrade = planIndex(plan.plan) > planIndex(dashboard.plan);

    if (isCurrent && !dashboard.pending_plan) {
      return { label: 'Current plan', variant: 'outline' as const, disabled: true };
    }
    if (isCurrent && dashboard.pending_plan) {
      return { label: 'Keep current plan', variant: 'default' as const, disabled: false };
    }
    if (isPending) {
      return { label: 'Scheduled', variant: 'outline' as const, disabled: true };
    }
    if (isUpgrade) {
      return { label: 'Upgrade', variant: 'default' as const, disabled: false };
    }
    return { label: 'Downgrade', variant: 'outline' as const, disabled: false };
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Clear monthly limits by organization. Upgrade instantly from the dashboard.
      </p>

      {dashboard?.pending_plan && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          Downgrade to {PLAN_LABELS[dashboard.pending_plan]} scheduled at the end of your current billing period.
        </p>
      )}

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((plan) => {
          const isCurrent = isAuthenticated && dashboard?.plan === plan.plan && !dashboard?.pending_plan;
          const isPending = isAuthenticated && dashboard?.pending_plan === plan.plan;
          const { label, variant, disabled } = getButtonProps(plan);

          return (
            <Card
              key={plan.plan}
              className={cn(
                isCurrent && 'border-primary/50 ring-1 ring-primary/20',
                isPending && 'border-amber-500/50',
                !isCurrent && !isPending && plan.plan === 'pro' && 'border-primary/50',
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{PLAN_LABELS[plan.plan]}</CardTitle>
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
                <CardDescription>
                  <span className="text-3xl font-semibold text-foreground">${plan.monthly_price_usd}</span> / month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{plan.rendered_emails_limit.toLocaleString()} rendered emails / month</p>
                <p>{formatBytes(plan.storage_limit_bytes)} media storage</p>
                <p>{formatBytes(plan.max_upload_size_bytes)} max upload size</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={variant}
                  disabled={disabled}
                  onClick={() => { void handleChoosePlan(plan); }}
                >
                  {label}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
