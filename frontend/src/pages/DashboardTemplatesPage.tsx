import { type FormEvent, useCallback, useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { TemplateDetail, TemplateListItem } from '../types/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const EMPTY_TEMPLATE = '{}';

export function DashboardTemplatesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<TemplateListItem[]>([]);
  const [selected, setSelected] = useState<TemplateDetail | null>(null);
  const [createName, setCreateName] = useState('');
  const [createJson, setCreateJson] = useState(EMPTY_TEMPLATE);
  const [editName, setEditName] = useState('');
  const [editJson, setEditJson] = useState(EMPTY_TEMPLATE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!token) return;
    const result = await api.listTemplates(token);
    setItems(result.results);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void loadTemplates().catch((err: Error) => setError(err.message));
  }, [loadTemplates, token]);

  const parseJson = (raw: string) => {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error('Invalid JSON payload');
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      await api.createTemplate(token, {
        name: createName,
        json_data: parseJson(createJson),
      });
      setCreateName('');
      setCreateJson(EMPTY_TEMPLATE);
      await loadTemplates();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const selectTemplate = async (id: string) => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const detail = await api.getTemplate(token, id);
      setSelected(detail);
      setEditName(detail.name);
      setEditJson(JSON.stringify(detail.json_data, null, 2));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const updateSelected = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selected) return;

    setBusy(true);
    setError(null);
    try {
      const detail = await api.updateTemplate(token, selected.id, {
        name: editName,
        json_data: parseJson(editJson),
      });
      setSelected(detail);
      await loadTemplates();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      await api.deleteTemplate(token, id);
      if (selected?.id === id) {
        setSelected(null);
        setEditName('');
        setEditJson(EMPTY_TEMPLATE);
      }
      await loadTemplates();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">Create, edit, and delete organization templates.</p>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create template</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-json">JSON data</Label>
                <Textarea
                  id="create-json"
                  value={createJson}
                  onChange={(e) => setCreateJson(e.target.value)}
                  className="min-h-[220px] font-mono text-xs"
                />
              </div>
              <Button disabled={busy} type="submit">
                {busy ? 'Saving...' : 'Create template'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? <p className="text-sm text-muted-foreground">No templates yet.</p> : null}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Updated {new Date(item.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void selectTemplate(item.id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      void deleteTemplate(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit template</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={updateSelected}>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-json">JSON data</Label>
                <Textarea
                  id="edit-json"
                  value={editJson}
                  onChange={(e) => setEditJson(e.target.value)}
                  className="min-h-[260px] font-mono text-xs"
                />
              </div>
              <Button disabled={busy} type="submit">
                {busy ? 'Updating...' : 'Update template'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
