import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

import { Button } from '../ui/button';

export function HeroSection() {
  return (
    <section className="pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-36 lg:pb-40">
      <div className="mx-auto max-w-text px-6 text-center sm:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-caption text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-marketing-accent" />
          <span>An AI email designer you embed in your product</span>
        </div>

        <h1 className="mt-8 text-display font-bold tracking-tight text-foreground text-balance">
          Describe the email.{' '}
          <span className="text-marketing-accent">MailCraft designs it.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground text-pretty">
          Your users say what they want to send. The AI writes the copy, lays out the design and picks
          the photos while they watch, then makes changes they ask for in plain words. Every email is
          editable blocks that render in Gmail and Outlook, with a drag-and-drop editor and a render
          API around it.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="xl" className="rounded-full px-8" asChild>
            <a href="/builder/">
              Try the live builder
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="xl" variant="outline" className="rounded-full px-8" asChild>
            <Link to="/register">Get API key — free</Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-caption text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-marketing-accent" />
            No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-marketing-accent" />
            5-minute iframe &amp; postMessage embed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-marketing-accent" />
            Works with any ESP
          </span>
        </div>
      </div>

      {/* Product Stage — Editorial Studio Mockup */}
      <div className="mx-auto mt-16 max-w-media px-4 sm:mt-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-tile border border-border bg-card">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-border" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                mailcraft.contentor.app/builder
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                600px responsive canvas
              </span>
              <span className="hidden rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground sm:inline-block">
                Export HTML
              </span>
            </div>
          </div>

          {/* 3-pane builder preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left sidebar: blocks */}
            <div className="hidden border-r border-border bg-muted/30 p-5 lg:col-span-3 lg:block">
              <p className="text-eyebrow text-muted-foreground">Content blocks</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'Heading', code: 'H1' },
                  { label: 'Paragraph', code: 'Aa' },
                  { label: 'Image', code: 'IMG' },
                  { label: 'Button', code: 'CTA' },
                  { label: 'Columns', code: '2×' },
                  { label: 'Divider', code: '—' },
                  { label: 'Hero Block', code: '★' },
                  { label: 'Product', code: '$' },
                ].map((block) => (
                  <div
                    key={block.label}
                    className="flex flex-col justify-between rounded-xl border border-border bg-background p-3 transition-colors hover:border-foreground/30"
                  >
                    <span className="font-mono text-xs font-semibold text-marketing-accent">
                      {block.code}
                    </span>
                    <span className="mt-2 text-xs font-medium text-foreground">{block.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-border bg-background p-3.5">
                <p className="text-eyebrow text-marketing-accent">AI Assistant</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  &ldquo;Create a Q4 product release announcement with two feature callouts and a
                  primary CTA.&rdquo;
                </p>
              </div>
            </div>

            {/* Center canvas */}
            <div className="bg-muted/50 p-6 sm:p-10 lg:col-span-6">
              <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-border bg-background text-foreground">
                <div className="border-b border-border bg-muted/40 px-6 py-4 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold tracking-tight">
                    ACME STUDIO
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Release v4.2
                  </span>
                </div>
                <div className="p-6 sm:p-8 space-y-5">
                  <div className="rounded-lg border border-marketing-accent/40 bg-muted/30 p-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-marketing-accent">
                      Heading Block · Selected
                    </span>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                      Hi {'{{first_name}}'}, autumn dispatch is live.
                    </h3>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We refined every transactional and marketing template to render identically
                    across Apple Mail, Gmail, and Outlook desktop clients.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                      <p className="font-mono text-xs text-marketing-accent">01</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        Visual Block Schema
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Clean JSON state saved via postMessage.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                      <p className="font-mono text-xs text-marketing-accent">02</p>
                      <p className="mt-1 text-xs font-semibold text-foreground">
                        Dynamic Merge Tags
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Injected at render time via REST API.
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground">
                      Read release notes →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right inspector */}
            <div className="hidden border-l border-border bg-muted/30 p-5 lg:col-span-3 lg:block">
              <p className="text-eyebrow text-muted-foreground">Inspector · Heading</p>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Font size</span>
                    <span className="font-mono text-foreground">24px</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                    <div className="h-1.5 w-2/3 rounded-full bg-foreground" />
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Merge variable</span>
                  <div className="mt-1.5 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-marketing-accent">
                    {'{{first_name}}'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground">Padding (px)</span>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-center">
                      V: 16
                    </div>
                    <div className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-center">
                      H: 24
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-eyebrow text-muted-foreground">Output</p>
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    Table-safe HTML + JSON schema ready for webhook or API render.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
