import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Copy, Eye, EyeOff, KeyRound, Mail, Sparkles } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS } from '../lib/plans';
import type { SiteDashboardResponse } from '../types/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
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

  const [tokenVisible, setTokenVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToken = useCallback(() => {
    if (!token) return;
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [token]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-eyebrow text-marketing-accent">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active workspace: <span className="font-medium text-foreground">{organization?.name ?? 'Default'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link to="/dashboard/organizations">Manage Organizations</Link>
          </Button>
          <Button size="sm" className="rounded-full" asChild>
            <Link to="/dashboard/email-builder">
              Configure Builder
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Current plan</CardDescription>
              <Sparkles className="h-4 w-4 text-marketing-accent" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {data ? PLAN_LABELS[data.plan] : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between pt-2">
            {data?.stripe_subscription_id ? (
              <Badge variant="success">Active subscription</Badge>
            ) : (
              <Badge variant="secondary">Free tier</Badge>
            )}
            <Link
              to="/dashboard/billing"
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Billing →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Email renders</CardDescription>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="font-mono text-2xl font-bold tracking-tight">
              {data?.rendered_emails_count.toLocaleString() ?? '—'}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {data?.rendered_emails_limit.toLocaleString() ?? '—'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${renderUsage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media storage</CardDescription>
            <CardTitle className="font-mono text-2xl font-bold tracking-tight">
              {data ? formatBytes(data.storage_used_bytes) : '—'}
              <span className="text-sm font-normal text-muted-foreground">
                {' '}
                / {data ? formatBytes(data.storage_limit_bytes) : '—'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${storageUsage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Organizations</CardDescription>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="font-mono text-2xl font-bold tracking-tight">
              {data?.organizations_count ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              to="/dashboard/organizations"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-marketing-accent"
            >
              Manage workspaces
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Account & Developer Token */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-marketing-accent" />
              <CardTitle className="text-base">Developer Site Token</CardTitle>
            </div>
            <CardDescription>
              Authenticate against the Account API programmatically. Provision new organizations and
              API keys via{' '}
              <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                POST /api/v1/site/provision
              </code>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
              <Input
                readOnly
                value={tokenVisible && token ? token : '••••••••••••••••••••••••••••••••••••••••'}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={() => setTokenVisible((v) => !v)}
              >
                {tokenVisible ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Reveal
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3" onClick={copyToken}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pass as{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                Authorization: Token {'<token>'}
              </code>
              . Read the{' '}
              <Link
                to="/dashboard/docs#account-api"
                className="font-medium text-foreground underline underline-offset-4 hover:text-marketing-accent"
              >
                Account API documentation
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
            <CardDescription>Signed-in owner profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium text-foreground">{user?.username ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate font-mono text-xs text-foreground">
                {user?.email ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Active API keys</span>
              <span className="font-mono text-xs font-medium text-foreground">
                {data?.active_api_keys_count ?? '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
