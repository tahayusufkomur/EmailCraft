import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, KeyRound, Plus, RefreshCw, Wand2, X } from 'lucide-react';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PLAN_LABELS } from '../lib/plans';
import { formatBytes } from '../lib/utils';
import type { OrganizationWithApiKeys, SiteDashboardResponse } from '../types/api';

type OrganizationDraft = {
  name: string;
  allowedOrigins: string[];
  originInput: string;
};

function toDraft(org: OrganizationWithApiKeys): OrganizationDraft {
  return {
    name: org.name,
    allowedOrigins: org.allowed_origins || [],
    originInput: '',
  };
}

export function DashboardOrganizationsPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<OrganizationWithApiKeys[]>([]);
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OrganizationDraft>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createAllowedOrigins, setCreateAllowedOrigins] = useState<string[]>([]);
  const [createOriginInput, setCreateOriginInput] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState<Record<string, string>>({});
  const [copyFeedback, setCopyFeedback] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    if (!token) return;
    const [orgResult, dashboardResult] = await Promise.all([
      api.listOrganizations(token),
      api.getDashboard(token),
    ]);
    setItems(orgResult.results);
    setDashboard(dashboardResult);
    setDrafts((previous) => {
      const next: Record<string, OrganizationDraft> = {};
      for (const organization of orgResult.results) {
        next[organization.id] = previous[organization.id] ?? toDraft(organization);
      }
      return next;
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadOrganizations().catch((err: Error) => setError(err.message));
  }, [loadOrganizations, token]);

  const accountPlan = useMemo(
    () => (dashboard?.plan ? PLAN_LABELS[dashboard.plan] : '—'),
    [dashboard],
  );
  const renderUsage = useMemo(() => {
    if (!dashboard || dashboard.rendered_emails_limit === 0) return 0;
    return Math.min(100, (dashboard.rendered_emails_count / dashboard.rendered_emails_limit) * 100);
  }, [dashboard]);
  const storageUsage = useMemo(() => {
    if (!dashboard || dashboard.storage_limit_bytes === 0) return 0;
    return Math.min(100, (dashboard.storage_used_bytes / dashboard.storage_limit_bytes) * 100);
  }, [dashboard]);

  const resetCreateState = () => {
    setCreateName('');
    setCreateAllowedOrigins([]);
    setCreateOriginInput('');
  };

  const addCreateOrigin = () => {
    const nextOrigin = createOriginInput.trim();
    if (!nextOrigin) return;
    setCreateAllowedOrigins((previous) =>
      previous.includes(nextOrigin) ? previous : [...previous, nextOrigin],
    );
    setCreateOriginInput('');
  };

  const removeCreateOrigin = (origin: string) => {
    setCreateAllowedOrigins((previous) => previous.filter((item) => item !== origin));
  };

  const handleCreateOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setBusyAction('create');
    setError(null);
    try {
      const created = await api.createOrganization(token, {
        name: createName,
        allowed_origins: createAllowedOrigins,
      });

      if (created.created_api_key?.raw) {
        setGeneratedKeys((previous) => ({
          ...previous,
          [created.organization.id]: created.created_api_key?.raw || '',
        }));
      }

      resetCreateState();
      setIsCreateOpen(false);
      await loadOrganizations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const updateDraft = (organizationId: string, patch: Partial<OrganizationDraft>) => {
    setDrafts((previous) => ({
      ...previous,
      [organizationId]: {
        ...previous[organizationId],
        ...patch,
      },
    }));
  };

  const addDraftOrigin = (organizationId: string) => {
    const current = drafts[organizationId];
    if (!current) return;
    const nextOrigin = current.originInput.trim();
    if (!nextOrigin) return;
    if (current.allowedOrigins.includes(nextOrigin)) {
      updateDraft(organizationId, { originInput: '' });
      return;
    }
    updateDraft(organizationId, {
      allowedOrigins: [...current.allowedOrigins, nextOrigin],
      originInput: '',
    });
  };

  const removeDraftOrigin = (organizationId: string, origin: string) => {
    const current = drafts[organizationId];
    if (!current) return;
    updateDraft(organizationId, {
      allowedOrigins: current.allowedOrigins.filter((item) => item !== origin),
    });
  };

  const handleSaveOrganization = async (organizationId: string) => {
    if (!token) return;
    const draft = drafts[organizationId];
    if (!draft) return;
    setBusyAction(`save:${organizationId}`);
    setError(null);
    try {
      const updated = await api.updateOrganization(token, organizationId, {
        name: draft.name,
        allowed_origins: draft.allowedOrigins,
      });

      setItems((previous) =>
        previous.map((organization) =>
          organization.id === organizationId ? updated : organization,
        ),
      );
      setDrafts((previous) => ({
        ...previous,
        [organizationId]: toDraft(updated),
      }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const getReusableApiKey = async (organizationId: string, refresh = false) => {
    if (!token) return null;
    const response = await api.createOrganizationApiKey(token, organizationId, {
      refresh,
    });
    setGeneratedKeys((previous) => ({ ...previous, [organizationId]: response.raw }));
    await loadOrganizations();
    return response.raw;
  };

  const copyApiKeyToClipboard = async (organizationId: string, apiKey: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(apiKey);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = apiKey;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!success) {
          throw new Error('Clipboard copy command failed.');
        }
      }
      setCopyFeedback((previous) => ({ ...previous, [organizationId]: 'Copied' }));
    } catch {
      setCopyFeedback((previous) => ({ ...previous, [organizationId]: 'Copy failed' }));
      setError('Could not copy API key to clipboard.');
    }
  };

  const handleCopyApiKey = async (organizationId: string) => {
    setBusyAction(`copy:${organizationId}`);
    setError(null);
    try {
      let apiKey = generatedKeys[organizationId];
      if (!apiKey) {
        const resolved = await getReusableApiKey(organizationId, false);
        apiKey = resolved || '';
      }
      if (!apiKey) {
        throw new Error('Unable to resolve API key for this organization.');
      }
      await copyApiKeyToClipboard(organizationId, apiKey);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRefreshApiKey = async (organizationId: string) => {
    setBusyAction(`refresh:${organizationId}`);
    setError(null);
    try {
      const refreshed = await getReusableApiKey(organizationId, true);
      if (!refreshed) {
        throw new Error('Unable to refresh API key for this organization.');
      }
      setCopyFeedback((previous) => ({ ...previous, [organizationId]: 'Refreshed' }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-eyebrow text-marketing-accent">Workspaces</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage per-organization API keys, allowed origins, and builder settings.
          </p>
        </div>

        <Button
          type="button"
          className="rounded-full"
          variant={isCreateOpen ? 'outline' : 'default'}
          onClick={() => setIsCreateOpen((previous) => !previous)}
        >
          {isCreateOpen ? (
            <>
              <X className="h-4 w-4" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New organization
            </>
          )}
        </Button>
      </div>

      {/* Account Summary Strip */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Badge variant="pro">{accountPlan}</Badge>
            <span className="text-sm text-muted-foreground">
              <strong className="font-semibold text-foreground">
                {dashboard?.organizations_count ?? items.length}
              </strong>{' '}
              active organization{(dashboard?.organizations_count ?? items.length) !== 1 ? 's' : ''}
            </span>
          </div>
          {dashboard && (
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span>
                Renders:{' '}
                <strong className="font-mono text-foreground">
                  {dashboard.rendered_emails_count.toLocaleString()} /{' '}
                  {dashboard.rendered_emails_limit.toLocaleString()}
                </strong>
              </span>
              <span>
                Storage:{' '}
                <strong className="font-mono text-foreground">
                  {formatBytes(dashboard.storage_used_bytes)} /{' '}
                  {formatBytes(dashboard.storage_limit_bytes)}
                </strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {isCreateOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Add organization</CardTitle>
            <CardDescription>
              Email is inherited from your account. Optionally restrict CORS origins for embedded
              sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateOrganization}>
              <div className="space-y-2">
                <Label htmlFor="create-org-name">Organization name</Label>
                <Input
                  id="create-org-name"
                  placeholder="Acme Marketing"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-origin-input">Allowed origins</Label>
                <div className="flex gap-2">
                  <Input
                    id="create-origin-input"
                    value={createOriginInput}
                    onChange={(event) => setCreateOriginInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addCreateOrigin();
                      }
                    }}
                    placeholder="https://app.example.com"
                  />
                  <Button type="button" variant="outline" onClick={addCreateOrigin}>
                    Add
                  </Button>
                </div>
                {createAllowedOrigins.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {createAllowedOrigins.map((origin) => (
                      <button
                        key={origin}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs text-foreground transition-colors hover:bg-accent"
                        type="button"
                        onClick={() => removeCreateOrigin(origin)}
                      >
                        {origin}
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="rounded-full"
                loading={busyAction === 'create'}
                loadingText="Creating..."
                type="submit"
              >
                Create organization
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {items.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No organizations yet. Click &ldquo;New organization&rdquo; above to create one.
            </CardContent>
          </Card>
        )}

        {items.map((organization) => {
          const draft = drafts[organization.id] ?? toDraft(organization);
          const generatedKey = generatedKeys[organization.id];
          const isSaving = busyAction === `save:${organization.id}`;
          const isCopyingKey = busyAction === `copy:${organization.id}`;
          const isRefreshingKey = busyAction === `refresh:${organization.id}`;
          const copyLabel = copyFeedback[organization.id];

          return (
            <Card key={organization.id} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl">{organization.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Plan: {PLAN_LABELS[organization.plan] ?? organization.plan}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="uppercase">
                  {organization.plan}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor={`name-${organization.id}`}>Name</Label>
                  <Input
                    id={`name-${organization.id}`}
                    value={draft.name}
                    onChange={(event) =>
                      updateDraft(organization.id, {
                        name: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`origin-input-${organization.id}`}>Allowed origins</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`origin-input-${organization.id}`}
                      value={draft.originInput}
                      onChange={(event) =>
                        updateDraft(organization.id, {
                          originInput: event.target.value,
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addDraftOrigin(organization.id);
                        }
                      }}
                      placeholder="https://app.example.com"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addDraftOrigin(organization.id)}
                    >
                      Add
                    </Button>
                  </div>
                  {draft.allowedOrigins.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {draft.allowedOrigins.map((origin) => (
                        <button
                          key={origin}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs text-foreground transition-colors hover:bg-accent"
                          type="button"
                          onClick={() => removeDraftOrigin(organization.id, origin)}
                        >
                          {origin}
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {dashboard && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Shared Account Quota
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Max {dashboard.max_media_files_per_upload} files/upload
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Email renders</span>
                        <span className="font-mono text-foreground">
                          {dashboard.rendered_emails_count.toLocaleString()} /{' '}
                          {dashboard.rendered_emails_limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-foreground"
                          style={{ width: `${renderUsage}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Storage</span>
                        <span className="font-mono text-foreground">
                          {formatBytes(dashboard.storage_used_bytes)} /{' '}
                          {formatBytes(dashboard.storage_limit_bytes)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-foreground"
                          style={{ width: `${storageUsage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {organization.api_keys.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active API Keys
                    </p>
                    <div className="space-y-1.5">
                      {organization.api_keys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-1.5 font-mono text-xs"
                        >
                          <span className="flex items-center gap-2 text-foreground">
                            <KeyRound className="h-3.5 w-3.5 text-marketing-accent" />
                            {apiKey.key_prefix}...
                          </span>
                          <span className="text-muted-foreground">
                            {apiKey.environment} · {apiKey.scope}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedKey && (
                  <div className="rounded-xl border border-border bg-muted/50 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">
                        Current reusable API key
                      </p>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void copyApiKeyToClipboard(organization.id, generatedKey);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copyLabel === 'Copied' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="mt-1.5 break-all font-mono text-xs text-muted-foreground">
                      {generatedKey}
                    </p>
                    {copyLabel === 'Refreshed' && (
                      <p className="mt-1 text-xs text-marketing-accent">API key refreshed.</p>
                    )}
                    {copyLabel === 'Copy failed' && (
                      <p className="mt-1 text-xs text-destructive">
                        Copy failed. Please copy manually.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button
                    disabled={isSaving}
                    onClick={() => {
                      void handleSaveOrganization(organization.id);
                    }}
                    type="button"
                    size="sm"
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    disabled={isCopyingKey}
                    onClick={() => {
                      void handleCopyApiKey(organization.id);
                    }}
                    type="button"
                    variant="secondary"
                    size="sm"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {isCopyingKey ? 'Copying...' : 'Copy API key'}
                  </Button>
                  <Button
                    disabled={isRefreshingKey}
                    onClick={() => {
                      void handleRefreshApiKey(organization.id);
                    }}
                    type="button"
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {isRefreshingKey ? 'Refreshing...' : 'Rotate key'}
                  </Button>
                  <Button asChild type="button" variant="outline" size="sm">
                    <Link to={`/dashboard/email-builder?orgId=${organization.id}`}>
                      <Wand2 className="h-3.5 w-3.5" />
                      Builder config
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
