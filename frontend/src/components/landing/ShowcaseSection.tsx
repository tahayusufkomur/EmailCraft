import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { AnimateIn } from '../ui/AnimateIn';

const tabs = [
  { id: 'builder', label: 'Drag & Drop Builder' },
  { id: 'gallery', label: 'Template Gallery' },
  { id: 'export', label: 'HTML Export' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const screenshots: Record<TabId, string> = {
  builder: '/screenshots/builder.avif',
  gallery: '/screenshots/gallery.avif',
  export: '/screenshots/export.png',
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

          {/* Screenshot with tab content */}
          <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-glow">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeTab}
                src={screenshots[activeTab]}
                alt={tabs.find((t) => t.id === activeTab)?.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              />
            </AnimatePresence>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
