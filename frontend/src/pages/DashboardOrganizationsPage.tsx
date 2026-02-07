import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { OrganizationWithApiKeys, SiteDashboardResponse } from '../types/api';

type OrganizationDraft = {
  name: string;
  email: string;
  allowedOriginsText: string;
};

function parseAllowedOrigins(raw: string) {
  return raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toDraft(org: OrganizationWithApiKeys): OrganizationDraft {
  return {
    name: org.name,
    email: org.email,
    allowedOriginsText: (org.allowed_origins || []).join('\n'),
  };
}

export function DashboardOrganizationsPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<OrganizationWithApiKeys[]>([]);
  const [dashboard, setDashboard] = useState<SiteDashboardResponse | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OrganizationDraft>>({});
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createAllowedOriginsText, setCreateAllowedOriginsText] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      for (const org of orgResult.results) {
        next[org.id] = previous[org.id] ?? toDraft(org);
      }
      return next;
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadOrganizations().catch((err: Error) => setError(err.message));
  }, [loadOrganizations, token]);

  const accountPlan = useMemo(() => dashboard?.plan ?? '-', [dashboard]);

  const handleCreateOrganization = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setBusyAction('create');
    setError(null);
    try {
      const created = await api.createOrganization(token, {
        name: createName,
        email: createEmail,
        allowed_origins: parseAllowedOrigins(createAllowedOriginsText),
      });

      setCreateName('');
      setCreateEmail('');
      setCreateAllowedOriginsText('');
      setIsCreateOpen(false);

      if (created.created_api_key?.raw) {
        setGeneratedKeys((previous) => ({
          ...previous,
          [created.organization.id]: created.created_api_key?.raw || '',
        }));
      }

      await loadOrganizations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
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
        email: draft.email,
        allowed_origins: parseAllowedOrigins(draft.allowedOriginsText),
      });

      setItems((previous) =>
        previous.map((org) => (org.id === organizationId ? updated : org)),
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
      await copyApiKey(organizationId, apiKey);
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

  const handleGoToBuilder = async (organizationId: string) => {
    setBusyAction(`builder:${organizationId}`);
    setError(null);
    try {
      let apiKey = generatedKeys[organizationId];
      if (!apiKey) {
        const createdKey = await getReusableApiKey(organizationId, false);
        apiKey = createdKey || '';
      }
      if (!apiKey) {
        throw new Error('Unable to create API key for this organization.');
      }

      const builderUrl = `/builder/?apiKey=${encodeURIComponent(apiKey)}`;
      window.open(builderUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const copyApiKey = async (organizationId: string, apiKey: string) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage organization settings and API keys. Your package usage is shared across all organizations.
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
            Each organization has separate settings and API keys.
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
              Fill the form below and we will create a test API key automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreateOrganization}>
              <div className="grid gap-3 md:grid-cols-2">
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
                  <Label htmlFor="create-org-email">Email</Label>
                  <Input
                    id="create-org-email"
                    value={createEmail}
                    onChange={(event) => setCreateEmail(event.target.value)}
                    required
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-allowed-origins">Allowed origins (comma or new line separated)</Label>
                <Textarea
                  id="create-allowed-origins"
                  value={createAllowedOriginsText}
                  onChange={(event) => setCreateAllowedOriginsText(event.target.value)}
                  className="min-h-[96px]"
                  placeholder="http://localhost:5173"
                />
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
          const isOpeningBuilder = busyAction === `builder:${organization.id}`;
          const copyLabel = copyFeedback[organization.id];

          return (
            <Card key={organization.id}>
              <CardHeader>
                <CardTitle>{organization.name}</CardTitle>
                <CardDescription>
                  {organization.email} · {organization.plan}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${organization.id}`}>Name</Label>
                    <Input
                      id={`name-${organization.id}`}
                      value={draft.name}
                      onChange={(event) =>
                        setDrafts((previous) => ({
                          ...previous,
                          [organization.id]: {
                            ...draft,
                            name: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`email-${organization.id}`}>Email</Label>
                    <Input
                      id={`email-${organization.id}`}
                      value={draft.email}
                      onChange={(event) =>
                        setDrafts((previous) => ({
                          ...previous,
                          [organization.id]: {
                            ...draft,
                            email: event.target.value,
                          },
                        }))
                      }
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`allowed-origins-${organization.id}`}>
                    Allowed origins (comma or new line separated)
                  </Label>
                  <Textarea
                    id={`allowed-origins-${organization.id}`}
                    value={draft.allowedOriginsText}
                    onChange={(event) =>
                      setDrafts((previous) => ({
                        ...previous,
                        [organization.id]: {
                          ...draft,
                          allowedOriginsText: event.target.value,
                        },
                      }))
                    }
                    className="min-h-[96px]"
                  />
                </div>

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
                  <Button
                    disabled={isOpeningBuilder}
                    onClick={() => {
                      void handleGoToBuilder(organization.id);
                    }}
                    type="button"
                  >
                    {isOpeningBuilder ? 'Opening...' : 'Go to Builder'}
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
                          void copyApiKey(organization.id, generatedKey);
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
