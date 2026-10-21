import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, PLAN_ORDER, sortPlans } from '../lib/plans';
import type { PlanKey, PricingPlan, SiteDashboardResponse } from '../types/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
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
      if (
        result.status === 'updated' ||
        result.status === 'upgraded' ||
        result.status === 'downgrade_scheduled' ||
        result.status === 'downgrade_cancelled' ||
        result.status === 'unchanged'
      ) {
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
        variant: plan.plan === 'pro' ? ('default' as const) : ('outline' as const),
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
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-eyebrow mb-3 text-muted-foreground">Pricing</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Clear monthly limits by organization. Start free and upgrade anytime as your volume
            scales.
          </p>
        </div>

        {dashboard?.pending_plan && (
          <div className="mb-6 rounded-xl border border-border bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
            Downgrade to <span className="font-semibold text-foreground">{PLAN_LABELS[dashboard.pending_plan]}</span> scheduled at the end of your current billing period.
          </div>
        )}

        {error && (
          <p className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((plan) => {
            const isCurrent =
              isAuthenticated && dashboard?.plan === plan.plan && !dashboard?.pending_plan;
            const isPending = isAuthenticated && dashboard?.pending_plan === plan.plan;
            const isHighlighted = plan.plan === 'pro';
            const { label, variant, disabled } = getButtonProps(plan);

            const features = [
              `${plan.rendered_emails_limit.toLocaleString()} rendered emails / month`,
              `${plan.ai_generations_limit.toLocaleString()} AI generations / month`,
              `${formatBytes(plan.storage_limit_bytes)} media storage`,
              `${formatBytes(plan.max_upload_size_bytes)} max upload size`,
              plan.monthly_price_usd === 0 ? 'Standard gallery templates' : 'All premium templates unlocked',
            ];

            return (
              <div
                key={plan.plan}
                className={cn(
                  'flex flex-col rounded-2xl border p-6 sm:p-8',
                  isHighlighted
                    ? 'border-foreground bg-card ring-1 ring-foreground'
                    : 'border-border bg-card',
                  isCurrent && !isHighlighted && 'border-foreground/50 ring-1 ring-foreground/20',
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {PLAN_LABELS[plan.plan]}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {isHighlighted && !isCurrent && <Badge variant="pro">Popular</Badge>}
                    {isCurrent && (
                      <Badge variant="success" className="gap-1">
                        <Check className="h-3 w-3" /> Current
                      </Badge>
                    )}
                    {isPending && <Badge variant="warning">Scheduled</Badge>}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${plan.monthly_price_usd}
                    </span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>

                <Button
                  className="mb-6 w-full rounded-full"
                  variant={variant}
                  disabled={disabled}
                  onClick={() => {
                    void handleChoosePlan(plan);
                  }}
                >
                  {label}
                </Button>

                <ul className="flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-marketing-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
