import { useEffect, useMemo, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, sortPlans } from '../lib/plans';
import type { PricingPlan, SiteDashboardResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function DashboardBillingPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void api
      .getDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));

    void api
      .fetchPricing()
      .then((res) => setPlans(sortPlans(res.plans)))
      .catch((err: Error) => setError(err.message));
  }, [token]);

  const sortedPlans = useMemo(() => sortPlans(plans), [plans]);

  const handleSubscribe = async (plan: PricingPlan['plan']) => {
    if (!token) return;
    setBusyPlan(plan);
    setError(null);
    try {
      const result = await api.subscribe(token, plan);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      const next = await api.getDashboard(token);
      setDashboard(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Current plan: {dashboard ? PLAN_LABELS[dashboard.plan] : '-'}
        </p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sortedPlans.map((plan) => (
          <Card key={plan.plan} className={dashboard?.plan === plan.plan ? 'border-primary/50' : ''}>
            <CardHeader>
              <CardTitle>{PLAN_LABELS[plan.plan]}</CardTitle>
              <CardDescription>${plan.monthly_price_usd}/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{plan.rendered_emails_limit.toLocaleString()} renders/month</p>
              <p>{formatBytes(plan.storage_limit_bytes)} storage</p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={dashboard?.plan === plan.plan ? 'secondary' : 'default'}
                disabled={busyPlan === plan.plan}
                onClick={() => {
                  void handleSubscribe(plan.plan);
                }}
              >
                {dashboard?.plan === plan.plan
                  ? 'Current plan'
                  : busyPlan === plan.plan
                    ? 'Processing...'
                    : 'Switch'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
