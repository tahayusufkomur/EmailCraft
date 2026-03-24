import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type {
  BuilderTheme,
  OrganizationVariable,
  OrganizationWithApiKeys,
} from '../types/api';

const DEFAULT_BUILDER_THEME: BuilderTheme = 'light-breeze';
const VARIABLE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const AUTO_SAVE_DEBOUNCE_MS = 1200;
const BUILDER_THEME_OPTIONS: Array<{ value: BuilderTheme; label: string }> = [
  { value: 'light-breeze', label: 'Light Breeze' },
  { value: 'light-paper', label: 'Light Paper' },
  { value: 'dark-slate', label: 'Dark Slate' },
  { value: 'dark-cosmos', label: 'Dark Cosmos' },
];

const toVariableDraft = (item: OrganizationVariable): OrganizationVariable => ({
  key: item.key || '',
  label: item.label || '',
  defaultValue: item.defaultValue || '',
  type: item.type === 'url' ? 'url' : 'text',
});

const sanitizeVariables = (items: OrganizationVariable[]): OrganizationVariable[] =>
  items
    .map((item) => ({
      key: item.key.trim(),
      label: item.label.trim(),
      type: (item.type === 'url' ? 'url' : 'text') as OrganizationVariable['type'],
      defaultValue: item.defaultValue?.trim() || undefined,
    }))
    .filter((item) => item.key.length > 0 && item.label.length > 0);

function parseInitialOrganizationId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('orgId');
}

type SnippetTab = 'html' | 'react' | 'curl';

const SNIPPET_TABS: Array<{ id: SnippetTab; label: string }> = [
  { id: 'html', label: 'HTML' },
  { id: 'react', label: 'React' },
  { id: 'curl', label: 'cURL' },
];

function getSnippet(tab: SnippetTab, apiKey: string): string {
  switch (tab) {
    case 'html':
      return `<iframe
  src="https://emailcraft.contentor.app/builder/?apiKey=${apiKey}"
  width="100%"
  height="800"
  frameborder="0"
  allow="clipboard-write"
></iframe>`;
    case 'react':
      return `import { useEffect, useRef } from 'react';

export function EmailBuilder() {
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (e.data?.source !== 'mailcraft') return;
      if (e.data.type === 'MAILCRAFT_SAVE') {
        console.log('HTML:', e.data.payload.html);
        console.log('JSON:', e.data.payload.json);
      }
    };
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  return (
    <iframe
      ref={ref}
      src="https://emailcraft.contentor.app/builder/?apiKey=${apiKey}"
      style={{ width: '100%', height: '800px', border: 'none' }}
      allow="clipboard-write"
    />
  );
}`;
    case 'curl':
      return `curl -X POST https://emailcraft.contentor.app/api/v1/render \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "YOUR_TEMPLATE_ID",
    "variables": {
      "user_name": "Jane"
    }
  }'`;
  }
}

function EmbedSnippetsCard({ apiKey, onCopy }: { apiKey: string; onCopy: (text: string) => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<SnippetTab>('html');
  const snippet = apiKey ? getSnippet(activeTab, apiKey) : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Snippets</CardTitle>
        <CardDescription>Copy a snippet with your API key pre-filled. Paste it into your project and it works immediately.</CardDescription>
      </CardHeader>
      <CardContent>
        {apiKey ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-0 rounded-lg border border-input bg-muted/50 p-0.5">
                {SNIPPET_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void onCopy(snippet)}
              >
                Copy
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs leading-relaxed">
              <code>{snippet}</code>
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select an organization to see embed snippets with your API key.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardWidgetBuilderPage() {
  const { token } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithApiKeys[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  const [showLogo, setShowLogo] = useState(true);
  const [showExportHtmlButton, setShowExportHtmlButton] = useState(true);
  const [builderTheme, setBuilderTheme] = useState<BuilderTheme>(DEFAULT_BUILDER_THEME);
  const [availableVariables, setAvailableVariables] = useState<OrganizationVariable[]>([]);
  const [generatedKeys, setGeneratedKeys] = useState<Record<string, string>>({});
  const [previewRevision, setPreviewRevision] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [lastAutoSavedUiSignature, setLastAutoSavedUiSignature] = useState('');

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
    setBuilderTheme(selectedOrganization.builder_theme || DEFAULT_BUILDER_THEME);
    const nextVariables = (selectedOrganization.available_variables || []).map(toVariableDraft);
    setAvailableVariables(nextVariables);
    setLastAutoSavedUiSignature(
      JSON.stringify({
        show_logo: selectedOrganization.show_logo,
        show_export_html_button: selectedOrganization.show_export_html_button,
        builder_theme: selectedOrganization.builder_theme || DEFAULT_BUILDER_THEME,
      }),
    );
  }, [selectedOrganization]);

  const variableValidationError = useMemo(() => {
    for (const item of availableVariables) {
      const key = item.key.trim();
      const label = item.label.trim();
      const hasAnyValue = key.length > 0 || label.length > 0 || (item.defaultValue || '').trim().length > 0;
      if (!hasAnyValue) continue;
      if (!key || !label) {
        return 'Each variable must include both key and label.';
      }
    }

    const sanitized = sanitizeVariables(availableVariables);
    const duplicates = new Set<string>();
    const seen = new Set<string>();

    for (const item of sanitized) {
      if (!VARIABLE_KEY_PATTERN.test(item.key)) {
        return `Invalid variable key "${item.key}". Use letters, digits, and underscores only, starting with a letter or underscore.`;
      }
      if (seen.has(item.key)) {
        duplicates.add(item.key);
      } else {
        seen.add(item.key);
      }
    }

    if (duplicates.size > 0) {
      return `Duplicate variable keys: ${Array.from(duplicates).sort().join(', ')}.`;
    }

    return null;
  }, [availableVariables]);

  const settingsPayload = useMemo(
    () => ({
      show_logo: showLogo,
      show_export_html_button: showExportHtmlButton,
      builder_theme: builderTheme,
      available_variables: sanitizeVariables(availableVariables),
    }),
    [availableVariables, builderTheme, showExportHtmlButton, showLogo],
  );
  const uiSettingsPayload = useMemo(
    () => ({
      show_logo: showLogo,
      show_export_html_button: showExportHtmlButton,
      builder_theme: builderTheme,
    }),
    [builderTheme, showExportHtmlButton, showLogo],
  );
  const uiSettingsSignature = useMemo(
    () => JSON.stringify(uiSettingsPayload),
    [uiSettingsPayload],
  );

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
      builderTheme,
      rev: String(previewRevision),
    });
    return `/builder/?${params.toString()}`;
  }, [builderTheme, generatedKeys, previewRevision, selectedOrganizationId, showExportHtmlButton, showLogo]);

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
    if (variableValidationError) {
      setError(variableValidationError);
      return;
    }
    setBusyAction('save');
    setError(null);
    try {
      const updated = await api.updateOrganization(token, selectedOrganizationId, settingsPayload);
      setOrganizations((previous) =>
        previous.map((organization) => (
          organization.id === selectedOrganizationId ? updated : organization
        )),
      );
      setLastAutoSavedUiSignature(uiSettingsSignature);
      setPreviewRevision((previous) => previous + 1);
      setStatus('Settings saved');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyAction(null);
    }
  };

  useEffect(() => {
    if (!token || !selectedOrganizationId) return;
    if (busyAction === 'save') return;
    if (uiSettingsSignature === lastAutoSavedUiSignature) return;

    const timer = window.setTimeout(() => {
      setLastAutoSavedUiSignature(uiSettingsSignature);
      void api
        .updateOrganization(token, selectedOrganizationId, uiSettingsPayload)
        .then((updated) => {
          setOrganizations((previous) =>
            previous.map((organization) => (
              organization.id === selectedOrganizationId ? updated : organization
            )),
          );
          setPreviewRevision((previous) => previous + 1);
          setStatus('Display settings auto-saved');
        })
        .catch((err: Error) => {
          setError(err.message);
        });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    busyAction,
    lastAutoSavedUiSignature,
    selectedOrganizationId,
    uiSettingsPayload,
    uiSettingsSignature,
    token,
  ]);

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

  const handleAddVariable = () => {
    setAvailableVariables((previous) => [
      ...previous,
      { key: '', label: '', defaultValue: '', type: 'text' },
    ]);
  };

  const handleRemoveVariable = (index: number) => {
    setAvailableVariables((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleVariableChange = (
    index: number,
    field: keyof OrganizationVariable,
    value: string,
  ) => {
    setAvailableVariables((previous) =>
      previous.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        if (field === 'type') {
          return { ...item, type: value === 'url' ? 'url' : 'text' };
        }
        if (field === 'label') {
          return { ...item, label: value };
        }
        if (field === 'defaultValue') {
          return { ...item, defaultValue: value };
        }
        return { ...item, key: value };
      }),
    );
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
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Email Builder</h1>
        <p className="text-muted-foreground">
          Configure organization email builder settings and view them on a full preview surface.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Email Builder Settings</CardTitle>
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

            <label className="grid gap-1 text-sm">
              Builder theme
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={builderTheme}
                onChange={(event) => setBuilderTheme(event.target.value as BuilderTheme)}
              >
                {BUILDER_THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Available variables</p>
                <p className="text-xs text-muted-foreground">
                  These appear in the builder variable dropdown for this organization.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleAddVariable}>
                + Add variable
              </Button>
            </div>

            {availableVariables.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No variables configured yet.
              </p>
            ) : (
              <div className="space-y-2">
                {availableVariables.map((variable, index) => (
                  <div key={index} className="grid gap-2 md:grid-cols-12">
                    <Input
                      className="md:col-span-3"
                      placeholder="key (user_name)"
                      value={variable.key}
                      onChange={(event) => handleVariableChange(index, 'key', event.target.value)}
                    />
                    <Input
                      className="md:col-span-3"
                      placeholder="Label"
                      value={variable.label}
                      onChange={(event) => handleVariableChange(index, 'label', event.target.value)}
                    />
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm md:col-span-2"
                      value={variable.type || 'text'}
                      onChange={(event) => handleVariableChange(index, 'type', event.target.value)}
                    >
                      <option value="text">Text</option>
                      <option value="url">URL</option>
                    </select>
                    <Input
                      className="md:col-span-3"
                      placeholder="Default value (optional)"
                      value={variable.defaultValue || ''}
                      onChange={(event) => handleVariableChange(index, 'defaultValue', event.target.value)}
                    />
                    <Button
                      className="md:col-span-1"
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveVariable(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {variableValidationError && (
              <p className="text-xs text-destructive">{variableValidationError}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveSettings}
              disabled={busyAction === 'save' || Boolean(variableValidationError)}
            >
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

      <EmbedSnippetsCard
        apiKey={generatedKeys[selectedOrganizationId] || ''}
        onCopy={async (text: string) => {
          await copyToClipboard(text);
          setStatus('Snippet copied');
        }}
      />

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
