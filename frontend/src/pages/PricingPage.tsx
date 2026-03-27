import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS, sortPlans } from '../lib/plans';
import type { PricingPlan } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function PricingPage() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  const handleChoosePlan = async (plan: PricingPlan) => {
    setError(null);
    setBusyPlan(plan.plan);

    try {
      if (plan.monthly_price_usd === 0) {
        if (!isAuthenticated) {
          navigate('/login');
          return;
        }
        const result = await api.subscribe(token!, plan.plan);
        if (result.status === 'updated') {
          navigate('/dashboard/billing');
        }
        return;
      }

      if (isAuthenticated) {
        const result = await api.subscribe(token!, plan.plan);
        if (result.checkout_url) {
          window.location.href = result.checkout_url;
          return;
        }
        if (result.status === 'updated') {
          navigate('/dashboard/billing');
          return;
        }
        setError('Unexpected response from subscription.');
      } else {
        const result = await api.guestCheckout(plan.plan);
        window.location.href = result.checkout_url;
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyPlan(null);
    }
  };

  const getButtonText = (plan: PricingPlan) => {
    if (busyPlan === plan.plan) return 'Processing...';
    if (plan.monthly_price_usd === 0) {
      return isAuthenticated ? 'Switch to free' : 'Get started free';
    }
    return isAuthenticated ? 'Switch plan' : 'Get started';
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
                disabled={busyPlan === plan.plan}
                onClick={() => { void handleChoosePlan(plan); }}
              >
                {getButtonText(plan)}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
