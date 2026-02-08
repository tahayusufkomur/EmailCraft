import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS } from '../lib/plans';
import type { SiteDashboardResponse } from '../types/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { formatBytes } from '../lib/utils';

export function DashboardPage() {
  const { token, organization, user } = useAuth();
  const [data, setData] = useState<SiteDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void api
      .getDashboard(token)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [token]);

  const renderUsage = useMemo(() => {
    if (!data || data.rendered_emails_limit === 0) return 0;
    return Math.min(100, (data.rendered_emails_count / data.rendered_emails_limit) * 100);
  }, [data]);

  const storageUsage = useMemo(() => {
    if (!data || data.storage_limit_bytes === 0) return 0;
    return Math.min(100, (data.storage_used_bytes / data.storage_limit_bytes) * 100);
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Organization: {organization?.name}</p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current plan</CardDescription>
            <CardTitle>{data ? PLAN_LABELS[data.plan] : '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.stripe_subscription_id ? <Badge variant="secondary">Active subscription</Badge> : <Badge variant="outline">No active subscription</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Email renders</CardDescription>
            <CardTitle>
              {data?.rendered_emails_count.toLocaleString() ?? '-'} / {data?.rendered_emails_limit.toLocaleString() ?? '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${renderUsage}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Storage</CardDescription>
            <CardTitle>
              {data ? formatBytes(data.storage_used_bytes) : '-'} / {data ? formatBytes(data.storage_limit_bytes) : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${storageUsage}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Organizations</CardDescription>
            <CardTitle>{data?.organizations_count ?? '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/dashboard/organizations">Go to Builder</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>User information</CardDescription>
            <CardTitle>{user?.username ?? '-'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Email: {user?.email ?? '-'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
