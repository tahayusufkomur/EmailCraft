import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { TemplateListItem } from '../types/api';
import { renderTemplatePreview, type EmailTemplate } from '../lib/templatePreview';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

type Section = 'library' | 'custom';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>('library');
  const [previewHtml, setPreviewHtml] = useState('');
  const { token } = useAuth();

  const loadTemplates = useCallback(() => {
    if (!token) {
      setLoading(false);
      setError('Login required to view templates.');
      return;
    }
    setLoading(true);
    setError(null);
    void api.fetchTemplates(token)
      .then((res) => {
        setTemplates(res.results || []);
        setCurrentIndex(0);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load templates'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const libraryTemplates = useMemo(
    () => templates.filter((t) => t.template_type === 'provided'),
    [templates],
  );
  const customTemplates = useMemo(
    () => templates.filter((t) => t.template_type !== 'provided'),
    [templates],
  );

  const activeTemplates = activeSection === 'library' ? libraryTemplates : customTemplates;

  useEffect(() => {
    if (currentIndex >= activeTemplates.length) setCurrentIndex(0);
  }, [currentIndex, activeTemplates.length]);

  const currentTemplate = activeTemplates.length > 0 ? activeTemplates[currentIndex] : null;

  // Fetch full template detail for preview
  useEffect(() => {
    if (!currentTemplate || !token) {
      setPreviewHtml('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/site/templates/${currentTemplate.id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        if (cancelled || !res.ok) return;
        const detail = await res.json();
        if (cancelled || !detail.json_data) return;
        setPreviewHtml(renderTemplatePreview(detail.json_data as unknown as EmailTemplate));
      } catch {
        if (!cancelled) setPreviewHtml('');
      }
    })();
    return () => { cancelled = true; };
  }, [currentTemplate?.id, token]);

  const handlePrev = useCallback(() => {
    if (!activeTemplates.length) return;
    setCurrentIndex((prev) => (prev - 1 + activeTemplates.length) % activeTemplates.length);
  }, [activeTemplates.length]);

  const handleNext = useCallback(() => {
    if (!activeTemplates.length) return;
    setCurrentIndex((prev) => (prev + 1) % activeTemplates.length);
  }, [activeTemplates.length]);

  const handleDelete = useCallback(async () => {
    if (!token || !currentTemplate) return;
    if (!window.confirm(`Delete "${currentTemplate.name}"?`)) return;
    try {
      await api.deleteTemplate(token, currentTemplate.id);
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }, [token, currentTemplate, loadTemplates]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); handlePrev(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  return (
    <div className="relative overflow-hidden">
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top,_hsl(205_90%_58%_/_0.12),transparent_45%),radial-gradient(circle_at_80%_40%,_hsl(33_95%_57%_/_0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,_hsl(205_90%_58%_/_0.06),transparent_45%),radial-gradient(circle_at_80%_40%,_hsl(33_95%_57%_/_0.05),transparent_45%)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            Templates
          </div>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-5xl">
            Your email templates
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Browse default templates and your custom designs. Open the editor to customize any template.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        {/* Section tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeSection === 'library' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveSection('library'); setCurrentIndex(0); }}
          >
            Default Templates ({libraryTemplates.length})
          </Button>
          <Button
            variant={activeSection === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setActiveSection('custom'); setCurrentIndex(0); }}
          >
            My Templates ({customTemplates.length})
          </Button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {currentTemplate?.name ?? 'No templates'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {currentTemplate?.category && (
                <Badge variant="secondary">{currentTemplate.category}</Badge>
              )}
              {currentTemplate?.is_premium && (
                <Badge variant="outline">Premium</Badge>
              )}
              {currentTemplate?.is_locked && (
                <Badge variant="outline">Locked</Badge>
              )}
              {currentTemplate?.tags?.length
                ? currentTemplate.tags
                    .filter((tag) => tag && tag !== currentTemplate.category)
                    .map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))
                : null}
              <span>
                {activeTemplates.length > 0
                  ? `${currentIndex + 1} / ${activeTemplates.length}`
                  : '0 / 0'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={handlePrev}
              disabled={!activeTemplates.length || activeTemplates.length < 2}
              aria-label="Previous template"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={handleNext}
              disabled={!activeTemplates.length || activeTemplates.length < 2}
              aria-label="Next template"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {currentTemplate && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                  Loading templates...
                </div>
              ) : error ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-destructive">
                  {error}
                </div>
              ) : !currentTemplate ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                  No templates in this section.
                </div>
              ) : (
                <iframe
                  title={`Preview ${currentTemplate.name}`}
                  srcDoc={previewHtml}
                  className="h-[640px] w-full bg-white"
                  sandbox=""
                />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-5 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">How it works</p>
                  <p className="mt-3">
                    Use the arrows or your keyboard to move through templates. Each preview shows the full email layout.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                  Tip: hit <span className="font-mono">&larr;</span> or <span className="font-mono">&rarr;</span> to navigate.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Next step</p>
                <p>
                  Pick a template, then open the Email Builder to customize it for your organization.
                </p>
                <Button asChild size="sm" className="w-full">
                  <a href="/builder/">Open Email Builder</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
