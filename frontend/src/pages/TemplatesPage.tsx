import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { TemplateListItem } from '../types/api';
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
    void api
      .fetchTemplates(token)
      .then((res) => {
        setTemplates(res.results || []);
        setCurrentIndex(0);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load templates'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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

  useEffect(() => {
    if (!currentTemplate || !token) {
      setPreviewHtml('');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || '/api'}/site/templates/${currentTemplate.id}/`,
          {
            headers: { Authorization: `Token ${token}` },
          },
        );
        if (cancelled || !res.ok) return;
        const detail = await res.json();
        if (cancelled || !detail.preview_html) return;
        const isLocal =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const html = isLocal
          ? String(detail.preview_html).replaceAll(
              'https://mailcraft.contentor.app/gallery-assets/',
              '/gallery-assets/',
            )
          : detail.preview_html;
        setPreviewHtml(html);
      } catch {
        if (!cancelled) setPreviewHtml('');
      }
    })();
    return () => {
      cancelled = true;
    };
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
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrev();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  return (
    <div>
      <section className="border-b border-border bg-muted/50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-eyebrow text-marketing-accent">Template Library</p>
          <h1 className="mt-3 max-w-3xl text-display-2 font-bold tracking-tight text-foreground">
            Your email templates.
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg text-muted-foreground">
            Browse curated default templates and your organization’s custom designs. Open the
            interactive builder to customize any layout.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <Button
            variant={activeSection === 'library' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full px-4"
            onClick={() => {
              setActiveSection('library');
              setCurrentIndex(0);
            }}
          >
            Default Templates ({libraryTemplates.length})
          </Button>
          <Button
            variant={activeSection === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full px-4"
            onClick={() => {
              setActiveSection('custom');
              setCurrentIndex(0);
            }}
          >
            My Templates ({customTemplates.length})
          </Button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-eyebrow text-muted-foreground">Preview</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {currentTemplate?.name ?? 'No templates'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {currentTemplate?.category && (
                <Badge variant="secondary">{currentTemplate.category}</Badge>
              )}
              {currentTemplate?.is_premium && <Badge variant="pro">Premium</Badge>}
              {currentTemplate?.is_locked && <Badge variant="outline">Locked</Badge>}
              {currentTemplate?.tags?.length
                ? currentTemplate.tags
                    .filter((tag) => tag && tag !== currentTemplate.category)
                    .map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))
                : null}
              <span className="font-mono">
                {activeTemplates.length > 0
                  ? `${currentIndex + 1} / ${activeTemplates.length}`
                  : '0 / 0'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={handlePrev}
              disabled={!activeTemplates.length || activeTemplates.length < 2}
              aria-label="Previous template"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
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
                className="rounded-full gap-1.5 text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="overflow-hidden rounded-tile">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                  Loading templates...
                </div>
              ) : error ? (
                <div className="flex h-[640px] flex-col items-center justify-center gap-4 px-6 text-center">
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {!token && (
                      <Button size="sm" className="rounded-full" asChild>
                        <Link to="/login">Sign in to view library</Link>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="rounded-full" asChild>
                      <a href="/builder/">Try standalone builder</a>
                    </Button>
                  </div>
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
            <Card className="rounded-tile">
              <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
                <div>
                  <p className="text-eyebrow text-muted-foreground">Navigation</p>
                  <p className="mt-3 leading-relaxed">
                    Use the arrow controls or your keyboard to cycle through templates. Each preview
                    renders the compiled table-based email HTML.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/50 p-3.5 text-xs">
                  Tip: press <span className="font-mono text-foreground">&larr;</span> or{' '}
                  <span className="font-mono text-foreground">&rarr;</span> to switch templates.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-tile">
              <CardContent className="space-y-4 p-6 text-sm text-muted-foreground">
                <p className="text-eyebrow text-marketing-accent">Next Step</p>
                <p className="leading-relaxed">
                  Open the Email Builder to customize blocks, configure dynamic variables, or export
                  HTML.
                </p>
                <Button asChild className="w-full rounded-full">
                  <a href="/builder/">
                    Open Email Builder
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
