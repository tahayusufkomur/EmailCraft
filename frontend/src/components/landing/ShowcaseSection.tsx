import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { AnimateIn } from '../ui/AnimateIn';

const tabs = [
  { id: 'builder', label: 'Drag & Drop Builder' },
  { id: 'gallery', label: 'Template Gallery' },
  { id: 'export', label: 'HTML Export' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="shadow-glow overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1">
          <div className="mx-auto w-full max-w-md rounded-md border border-border bg-background px-3 py-1 text-center text-xs text-muted-foreground">
            mailcraft.contentor.app/builder
          </div>
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="aspect-video w-full bg-background">{children}</div>
    </div>
  );
}

function BuilderMockup() {
  return (
    <div className="flex h-full">
      {/* Left sidebar — block palette */}
      <div className="flex w-[200px] shrink-0 flex-col gap-3 border-r border-border bg-muted/40 p-4">
        <div className="h-3 w-20 rounded bg-muted-foreground/20" />
        {['w-full', 'w-3/4', 'w-full', 'w-5/6', 'w-full', 'w-2/3'].map((w, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/80 px-3 py-2.5">
            <div className="h-5 w-5 shrink-0 rounded bg-primary/20" />
            <div className={`h-2.5 ${w} rounded bg-muted-foreground/15`} />
          </div>
        ))}
      </div>

      {/* Center canvas */}
      <div className="flex flex-1 flex-col items-center overflow-hidden bg-muted/10 p-6">
        <div className="flex w-full max-w-md flex-1 flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          {/* Header block */}
          <div className="flex flex-col items-center gap-2 rounded-md bg-primary/8 px-4 py-5">
            <div className="h-3 w-32 rounded bg-primary/30" />
            <div className="h-2 w-48 rounded bg-primary/15" />
          </div>
          {/* Image placeholder */}
          <div className="flex h-24 items-center justify-center rounded-md bg-muted">
            <div className="h-8 w-8 rounded bg-muted-foreground/15" />
          </div>
          {/* Text lines */}
          <div className="flex flex-col gap-2 px-1">
            <div className="h-2.5 w-full rounded bg-foreground/10" />
            <div className="h-2.5 w-5/6 rounded bg-foreground/8" />
            <div className="h-2.5 w-4/6 rounded bg-foreground/6" />
          </div>
          {/* Button */}
          <div className="flex justify-center py-1">
            <div className="h-8 w-28 rounded-md bg-primary/70" />
          </div>
        </div>
      </div>

      {/* Right panel — style settings */}
      <div className="flex w-[240px] shrink-0 flex-col gap-4 border-l border-border bg-muted/40 p-4">
        <div className="h-3 w-24 rounded bg-muted-foreground/20" />
        {[
          { label: 'w-16', value: 'w-24' },
          { label: 'w-20', value: 'w-20' },
          { label: 'w-14', value: 'w-28' },
          { label: 'w-18', value: 'w-16' },
        ].map((row, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className={`h-2 ${row.label} rounded bg-muted-foreground/20`} />
            <div className={`h-7 ${row.value} rounded-md border border-border bg-background`} />
          </div>
        ))}
        <div className="mt-2 h-px w-full bg-border" />
        <div className="flex flex-col gap-2">
          <div className="h-2 w-12 rounded bg-muted-foreground/20" />
          <div className="flex gap-2">
            {['bg-primary/25', 'bg-blue-400/25', 'bg-amber-400/25', 'bg-emerald-400/25'].map((c, i) => (
              <div key={i} className={`h-6 w-6 rounded-full border border-border ${c}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryMockup() {
  const gradients = [
    'from-rose-400/60 to-orange-300/60',
    'from-violet-400/60 to-indigo-300/60',
    'from-emerald-400/60 to-teal-300/60',
    'from-amber-400/60 to-yellow-300/60',
    'from-sky-400/60 to-cyan-300/60',
    'from-pink-400/60 to-fuchsia-300/60',
  ];

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-3.5 w-36 rounded bg-foreground/12" />
        <div className="h-8 w-24 rounded-md border border-border bg-muted/50" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-4">
        {gradients.map((gradient, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
          >
            <div className={`h-3/5 bg-gradient-to-br ${gradient}`} />
            <div className="flex flex-1 flex-col justify-center gap-2 p-3">
              <div className="h-2.5 w-3/4 rounded bg-foreground/12" />
              <div className="h-2 w-1/2 rounded bg-muted-foreground/15" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportMockup() {
  const previewLines = [
    { w: 'w-2/3', opacity: 'bg-foreground/10' },
    { w: 'w-full', opacity: 'bg-foreground/6' },
    { w: 'w-5/6', opacity: 'bg-foreground/6' },
    { w: 'w-3/4', opacity: 'bg-foreground/8' },
    { w: 'w-full', opacity: 'bg-foreground/5' },
    { w: 'w-2/3', opacity: 'bg-foreground/6' },
  ];

  const codeLines = [
    { w: 'w-1/3', color: 'bg-violet-400/50' },
    { w: 'w-3/4', color: 'bg-sky-400/40' },
    { w: 'w-1/2', color: 'bg-emerald-400/40' },
    { w: 'w-5/6', color: 'bg-sky-400/30' },
    { w: 'w-2/5', color: 'bg-amber-400/40' },
    { w: 'w-3/5', color: 'bg-violet-400/35' },
    { w: 'w-4/5', color: 'bg-sky-400/35' },
    { w: 'w-1/2', color: 'bg-emerald-400/30' },
    { w: 'w-2/3', color: 'bg-amber-400/35' },
    { w: 'w-3/4', color: 'bg-violet-400/30' },
  ];

  return (
    <div className="flex h-full">
      {/* Email preview side */}
      <div className="flex flex-1 flex-col border-r border-border bg-background p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary/40" />
          <div className="h-2.5 w-24 rounded bg-foreground/12" />
        </div>
        <div className="flex flex-1 flex-col items-center rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex w-full flex-col items-center gap-2 rounded-md bg-primary/8 py-4">
            <div className="h-3 w-28 rounded bg-primary/30" />
            <div className="h-2 w-40 rounded bg-primary/15" />
          </div>
          <div className="mb-4 h-16 w-full rounded-md bg-muted" />
          <div className="flex w-full flex-col gap-2">
            {previewLines.map((line, i) => (
              <div key={i} className={`h-2 ${line.w} rounded ${line.opacity}`} />
            ))}
          </div>
          <div className="mt-4 h-7 w-24 rounded-md bg-primary/60" />
        </div>
      </div>

      {/* Code view side */}
      <div className="flex flex-1 flex-col bg-[#1e1e2e] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-2.5 w-16 rounded bg-white/15" />
          <div className="h-2.5 w-20 rounded bg-white/8" />
        </div>
        <div className="flex flex-1 flex-col gap-[7px] font-mono">
          {codeLines.map((line, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-5 text-right text-[10px] text-white/20">{i + 1}</span>
              <div className={`h-2 ${line.w} rounded-sm ${line.color}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const tabContent: Record<TabId, React.ReactNode> = {
  builder: <BuilderMockup />,
  gallery: <GalleryMockup />,
  export: <ExportMockup />,
};

export function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState<TabId>('builder');

  return (
    <section className="border-y border-border/60 bg-muted/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <AnimateIn direction="up" className="text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            See it in action
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted-foreground md:text-lg">
            From drag-and-drop to production HTML in minutes.
          </p>
        </AnimateIn>

        <AnimateIn direction="up" delay={0.15} className="mt-10">
          {/* Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="showcase-tab-bg"
                      className="absolute inset-0 rounded-md border-b-2 border-primary bg-background shadow-sm"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Browser frame with tab content */}
          <div className="mt-8">
            <BrowserFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="h-full w-full"
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </BrowserFrame>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
