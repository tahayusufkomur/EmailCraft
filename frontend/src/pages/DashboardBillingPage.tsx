import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS } from '../lib/plans';
import type { SiteDashboardResponse } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function DashboardBillingPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void api
      .getDashboard(token)
      .then(setDashboard)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  const handleManageSubscription = async () => {
    if (!token) return;
    setPortalBusy(true);
    setError(null);
    try {
      const result = await api.billingPortal(token);
      window.location.href = result.portal_url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Current plan: <span className="font-medium text-foreground">{dashboard ? PLAN_LABELS[dashboard.plan] : '-'}</span>
        </p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      {dashboard && (
        <>
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

          <div className="flex gap-3">
            {dashboard.stripe_subscription_id ? (
              <Button
                onClick={() => { void handleManageSubscription(); }}
                disabled={portalBusy}
              >
                {portalBusy ? 'Opening...' : 'Manage subscription'}
              </Button>
            ) : (
              <Button asChild>
                <a href="/pricing">View plans</a>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
