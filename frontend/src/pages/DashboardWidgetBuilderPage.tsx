import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { OrganizationWithApiKeys, ThemeMode } from '../types/api';

const DEFAULT_THEME_MODE: ThemeMode = 'system';

function parseInitialOrganizationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('orgId');
}

export function DashboardWidgetBuilderPage() {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithApiKeys[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [showLogo, setShowLogo] = useState(true);
  const [showExportHtmlButton, setShowExportHtmlButton] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [generatedKeys, setGeneratedKeys] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const initialOrganizationId = useMemo(parseInitialOrganizationId, []);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId],
  );

  const loadOrganizations = useCallback(async () => {
    if (!token) return;
    const result = await api.listOrganizations(token);
    setOrganizations(result.results);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadOrganizations().catch((err: Error) => setError(err.message));
  }, [loadOrganizations, token]);

  useEffect(() => {
    if (organizations.length === 0) return;
    if (selectedOrganizationId) return;
    if (initialOrganizationId && organizations.some((item) => item.id === initialOrganizationId)) {
      setSelectedOrganizationId(initialOrganizationId);
      return;
    }
    setSelectedOrganizationId(organizations[0].id);
  }, [initialOrganizationId, organizations, selectedOrganizationId]);

  useEffect(() => {
    if (!selectedOrganization) return;
    setShowLogo(selectedOrganization.show_logo);
    setShowExportHtmlButton(selectedOrganization.show_export_html_button);
    setThemeMode(selectedOrganization.theme_mode);
  }, [selectedOrganization]);

  const ensureReusableApiKey = useCallback(
    async (organizationId: string, refresh = false) => {
      if (!token) return null;
      const response = await api.createOrganizationApiKey(token, organizationId, { refresh });
      setGeneratedKeys((previous) => ({ ...previous, [organizationId]: response.raw }));
      return response.raw;
    },
    [token],
  );

  useEffect(() => {
    if (!selectedOrganizationId) return;
    if (generatedKeys[selectedOrganizationId]) return;
    void ensureReusableApiKey(selectedOrganizationId, false).catch(() => {
      setError('Could not resolve API key for preview.');
    });
  }, [ensureReusableApiKey, generatedKeys, selectedOrganizationId]);

  const previewSrc = useMemo(() => {
    if (!selectedOrganizationId) return '';
    const apiKey = generatedKeys[selectedOrganizationId];
    if (!apiKey) return '';

    const params = new URLSearchParams({
      apiKey,
      showLogo: showLogo ? 'true' : 'false',
      showExportHtmlButton: showExportHtmlButton ? 'true' : 'false',
      themeMode,
    });
    return `/builder/?${params.toString()}`;
  }, [generatedKeys, selectedOrganizationId, showExportHtmlButton, showLogo, themeMode]);

  const copyToClipboard = async (value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!success) {
      throw new Error('Clipboard copy failed.');
    }
  };

  const handleSaveSettings = async () => {
    if (!token || !selectedOrganizationId) return;
    setBusyAction('save');
    setError(null);
    try {
      await api.updateOrganization(token, selectedOrganizationId, {
        show_logo: showLogo,
        show_export_html_button: showExportHtmlButton,
        theme_mode: themeMode,
      });
      await loadOrganizations();
      setStatus('Settings saved');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleCopyApiKey = async () => {
    if (!selectedOrganizationId) return;
    setBusyAction('copy');
    setError(null);
    try {
      let key = generatedKeys[selectedOrganizationId];
      if (!key) {
        key = (await ensureReusableApiKey(selectedOrganizationId, false)) || '';
      }
      if (!key) throw new Error('API key is not available.');
      await copyToClipboard(key);
      setStatus('API key copied');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRefreshApiKey = async () => {
    if (!selectedOrganizationId) return;
    setBusyAction('refresh');
    setError(null);
    try {
      const key = await ensureReusableApiKey(selectedOrganizationId, true);
      if (!key) throw new Error('API key refresh failed.');
      setStatus('API key refreshed');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenBuilder = async () => {
    if (!selectedOrganizationId) return;
    setBusyAction('open');
    setError(null);
    try {
      let key = generatedKeys[selectedOrganizationId];
      if (!key) {
        key = (await ensureReusableApiKey(selectedOrganizationId, false)) || '';
      }
      if (!key) throw new Error('API key is not available.');
      window.open(`/builder/?apiKey=${encodeURIComponent(key)}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Widget Builder</h1>
        <p className="text-muted-foreground">
          Configure organization widget settings and view them on a full preview surface.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Widget Settings</CardTitle>
          <CardDescription>{status}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-1 text-sm md:col-span-2">
              Organization
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedOrganizationId}
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
              >
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              Theme mode
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={themeMode}
                onChange={(event) => setThemeMode(event.target.value as ThemeMode)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showLogo}
                  onChange={(event) => setShowLogo(event.target.checked)}
                />
                Show logo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showExportHtmlButton}
                  onChange={(event) => setShowExportHtmlButton(event.target.checked)}
                />
                Show export
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleSaveSettings} disabled={busyAction === 'save'}>
              {busyAction === 'save' ? 'Saving...' : 'Save settings'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCopyApiKey} disabled={busyAction === 'copy'}>
              {busyAction === 'copy' ? 'Copying...' : 'Copy API key'}
            </Button>
            <Button type="button" variant="outline" onClick={handleRefreshApiKey} disabled={busyAction === 'refresh'}>
              {busyAction === 'refresh' ? 'Refreshing...' : 'Refresh API key'}
            </Button>
            <Button type="button" onClick={handleOpenBuilder} disabled={busyAction === 'open'}>
              {busyAction === 'open' ? 'Opening...' : 'Open Builder'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Large preview area similar to demo page.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-hidden rounded-md border border-border bg-muted/30">
            {previewSrc ? (
              <iframe
                title="organization-widget-preview"
                src={previewSrc}
                className="h-[78vh] min-h-[720px] border-0"
                style={{ width: 'max(100%, 1220px)', minWidth: '1220px' }}
              />
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
                Select an organization to load preview.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
