import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
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

  const accountPlan = useMemo(() => dashboard?.plan ?? '-', [dashboard]);
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
    setCreateAllowedOrigins((previous) => (previous.includes(nextOrigin) ? previous : [...previous, nextOrigin]));
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
        previous.map((organization) => (organization.id === organizationId ? updated : organization)),
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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage per-organization API keys, allowed origins, and builder UI settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account package</CardTitle>
          <CardDescription>
            Current plan: {accountPlan}. Total organizations: {dashboard?.organizations_count ?? items.length}
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold">Your organizations</h2>
          <p className="text-sm text-muted-foreground">
            Create organizations and manage allowed origins and API keys.
          </p>
        </div>
        <Button
          type="button"
          variant={isCreateOpen ? 'secondary' : 'default'}
          onClick={() => setIsCreateOpen((previous) => !previous)}
        >
          {isCreateOpen ? 'Close' : '+ Add organization'}
        </Button>
      </div>

      {isCreateOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Add organization</CardTitle>
            <CardDescription>
              Email is inherited from the account. Add optional allowed origins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateOrganization}>
              <div className="space-y-2">
                <Label htmlFor="create-org-name">Name</Label>
                <Input
                  id="create-org-name"
                  value={createName}
                  onChange={(event) => setCreateName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-origin-input">Allowed origins</Label>
                <div className="flex flex-wrap gap-2">
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
                    placeholder="http://localhost:5173"
                  />
                  <Button type="button" variant="outline" onClick={addCreateOrigin}>
                    +
                  </Button>
                </div>
                {createAllowedOrigins.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {createAllowedOrigins.map((origin) => (
                      <button
                        key={origin}
                        className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                        type="button"
                        onClick={() => removeCreateOrigin(origin)}
                      >
                        {origin} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button disabled={busyAction === 'create'} type="submit">
                {busyAction === 'create' ? 'Creating...' : 'Create organization'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="py-6 text-sm text-muted-foreground">
              No organizations yet.
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
            <Card key={organization.id}>
              <CardHeader>
                <CardTitle>{organization.name}</CardTitle>
                <CardDescription>Plan: {organization.plan}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <div className="flex flex-wrap gap-2">
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
                      placeholder="http://localhost:5173"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addDraftOrigin(organization.id)}
                    >
                      +
                    </Button>
                  </div>
                  {draft.allowedOrigins.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {draft.allowedOrigins.map((origin) => (
                        <button
                          key={origin}
                          className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted"
                          type="button"
                          onClick={() => removeDraftOrigin(organization.id, origin)}
                        >
                          {origin} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {dashboard && (
                  <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3">
                    <p className="text-sm font-medium">Usage for this organization</p>
                    <p className="text-xs text-muted-foreground">
                      Package usage is shared across all organizations in your account.
                    </p>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Email renders</span>
                        <span>
                          {dashboard.rendered_emails_count.toLocaleString()} / {dashboard.rendered_emails_limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${renderUsage}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Storage</span>
                        <span>
                          {formatBytes(dashboard.storage_used_bytes)} / {formatBytes(dashboard.storage_limit_bytes)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${storageUsage}%` }} />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Max files per upload: {dashboard.max_media_files_per_upload}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={isSaving}
                    onClick={() => {
                      void handleSaveOrganization(organization.id);
                    }}
                    type="button"
                    variant="outline"
                  >
                    {isSaving ? 'Saving...' : 'Save settings'}
                  </Button>
                  <Button
                    disabled={isCopyingKey}
                    onClick={() => {
                      void handleCopyApiKey(organization.id);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    {isCopyingKey ? 'Copying...' : 'Copy API key'}
                  </Button>
                  <Button
                    disabled={isRefreshingKey}
                    onClick={() => {
                      void handleRefreshApiKey(organization.id);
                    }}
                    type="button"
                    variant="outline"
                  >
                    {isRefreshingKey ? 'Refreshing...' : 'Refresh API key'}
                  </Button>
                  <Button asChild type="button" variant="outline">
                    <Link to={`/dashboard/email-builder?orgId=${organization.id}`}>Open Email Builder</Link>
                  </Button>
                </div>

                {organization.api_keys.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Active API keys</p>
                    <div className="space-y-1">
                      {organization.api_keys.map((apiKey) => (
                        <p key={apiKey.id} className="text-xs text-muted-foreground">
                          {apiKey.key_prefix}... · {apiKey.environment} · {apiKey.scope}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {generatedKey && (
                  <div className="rounded-md border border-border bg-muted/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">Current reusable API key</p>
                      <Button
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void copyApiKeyToClipboard(organization.id, generatedKey);
                        }}
                      >
                        {copyLabel === 'Copied' ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs">{generatedKey}</p>
                    {copyLabel === 'Refreshed' && (
                      <p className="mt-1 text-xs text-muted-foreground">API key refreshed.</p>
                    )}
                    {copyLabel === 'Copy failed' && (
                      <p className="mt-1 text-xs text-destructive">Copy failed. Please copy manually.</p>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
