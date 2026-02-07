import { useEffect, useMemo, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, sortPlans } from '../lib/plans';
import type { PricingPlan } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function PricingPage() {
  const { token, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .fetchPricing()
      .then((res) => setPlans(sortPlans(res.plans)))
      .catch((err: Error) => setError(err.message));
  }, []);

  const cards = useMemo(() => sortPlans(plans), [plans]);

  const subscribe = async (plan: PricingPlan['plan']) => {
    if (!token) {
      setError('Log in first to subscribe to a plan.');
      return;
    }

    setError(null);
    setBusyPlan(plan);

    try {
      const result = await api.subscribe(token, plan);
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
        return;
      }
      if (result.status === 'updated') {
        window.location.href = '/dashboard/billing';
        return;
      }
      setError('Subscription response did not include checkout details.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight">Pricing</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Clear monthly limits by organization. Upgrade instantly from the dashboard.
      </p>

      {error && <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((plan) => (
          <Card key={plan.plan} className={plan.plan === 'pro' ? 'border-primary/50' : ''}>
            <CardHeader>
              <CardTitle>{PLAN_LABELS[plan.plan]}</CardTitle>
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
                variant={plan.plan === 'free' ? 'outline' : 'default'}
                disabled={!isAuthenticated || busyPlan === plan.plan}
                onClick={() => {
                  void subscribe(plan.plan);
                }}
              >
                {!isAuthenticated ? 'Log in to choose' : busyPlan === plan.plan ? 'Processing...' : 'Choose plan'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
