import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '../ui/button';

const showcaseItems = [
  {
    id: 'welcome-onboarding',
    category: 'SaaS Onboarding',
    title: 'Welcome & Workspace Setup',
    description: 'Clean activation checklist with primary CTA and personalized merge variables.',
    subject: 'Welcome to {{workspace_name}} — let’s get started',
  },
  {
    id: 'product-launch',
    category: 'Product Release',
    title: 'Feature Announcement',
    description: 'Editorial hero banner, two-column feature breakdown, and changelog deep link.',
    subject: 'Introducing Autumn Release 4.0',
  },
  {
    id: 'order-confirmation',
    category: 'Transactional',
    title: 'Order Receipt & Summary',
    description: 'Itemized receipt layout with shipping status and customer support footer.',
    subject: 'Your receipt for order #{{order_id}}',
  },
];

export function ShowcaseSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-media px-6 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <p className="text-eyebrow text-muted-foreground">Starter Gallery</p>
            <h2 className="mt-3 text-display-2 font-bold tracking-tight text-foreground text-balance">
              Start from a curated template.
            </h2>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/templates">
              Browse all templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {showcaseItems.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-tile border border-border bg-card p-8 transition-colors hover:border-foreground/30"
            >
              <div>
                <p className="text-eyebrow text-marketing-accent">{item.category}</p>
                <h3 className="mt-3 text-title-2 font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-body text-muted-foreground">{item.description}</p>

                <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
                  <p className="font-mono text-[11px] text-muted-foreground">Subject line</p>
                  <p className="mt-1 font-mono text-xs text-foreground">{item.subject}</p>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-4">
                <a
                  href={`/builder/?template=${item.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-marketing-accent"
                >
                  Open in Builder
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
