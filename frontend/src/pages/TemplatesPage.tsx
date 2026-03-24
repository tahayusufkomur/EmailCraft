import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { GalleryTemplate } from '../types/api';
import { renderTemplatePreview, type EmailTemplate } from '../lib/templatePreview';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Login required to view templates.');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    void api.fetchGalleryTemplates(token)
      .then((res) => {
        if (!isMounted) return;
        setTemplates(res.data || []);
        setCurrentIndex(0);
      })
      .catch((err: Error) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load templates');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (currentIndex >= templates.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, templates.length]);

  const hasTemplates = templates.length > 0;
  const currentTemplate = hasTemplates ? templates[currentIndex] : null;
  const previewHtml = useMemo(() => {
    if (!currentTemplate) return '';
    return renderTemplatePreview(currentTemplate.json_data as unknown as EmailTemplate);
  }, [currentTemplate]);

  const handlePrev = useCallback(() => {
    if (!templates.length) return;
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  }, [templates.length]);

  const handleNext = useCallback(() => {
    if (!templates.length) return;
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  }, [templates.length]);

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
    <div className="relative overflow-hidden">
      <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top,_hsl(205_90%_58%_/_0.12),transparent_45%),radial-gradient(circle_at_80%_40%,_hsl(33_95%_57%_/_0.12),transparent_45%)]">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            Gallery
          </div>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-5xl">
            Browse the template gallery
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Cycle through curated, production-ready templates and preview the full layout before you start editing.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {currentTemplate?.name ?? 'Template Gallery'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {currentTemplate?.category && (
                <Badge variant="secondary">{currentTemplate.category}</Badge>
              )}
              {currentTemplate?.is_premium && (
                <Badge variant="outline">Premium</Badge>
              )}
              {currentTemplate?.tags?.length
                ? currentTemplate.tags
                    .filter((tag) => tag && tag !== currentTemplate.category)
                    .map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))
                : null}
              <span>
                {hasTemplates ? `${currentIndex + 1} / ${templates.length}` : '0 / 0'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={handlePrev}
              disabled={!hasTemplates || templates.length < 2}
              aria-label="Previous template"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={handleNext}
              disabled={!hasTemplates || templates.length < 2}
              aria-label="Next template"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card className="relative overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                  Loading templates…
                </div>
              ) : error ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-destructive">
                  {error}
                </div>
              ) : !currentTemplate ? (
                <div className="flex h-[640px] items-center justify-center text-sm text-muted-foreground">
                  No templates available.
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
                    Use the arrows or your keyboard to move through the gallery. Each preview shows the full email layout.
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                  Tip: hit <span className="font-mono">←</span> or <span className="font-mono">→</span> to navigate.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Next step</p>
                <p>
                  Pick a template from the gallery, then open the Email Builder to customize it for your organization.
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
