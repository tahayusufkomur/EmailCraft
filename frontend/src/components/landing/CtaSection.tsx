import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Button } from '../ui/button';

export function CtaSection() {
  return (
    <section className="bg-muted py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-text px-6 text-center sm:px-8">
        <p className="text-eyebrow text-marketing-accent">Get started</p>
        <h2 className="mt-4 text-display font-bold tracking-tight text-foreground text-balance">
          Ready to upgrade your email workflow?
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-body-lg text-muted-foreground">
          Launch the interactive builder right now or create a free account to generate your
          organization API key.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="xl" className="rounded-full px-8" asChild>
            <Link to="/register">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" className="rounded-full px-8" asChild>
            <a href="/builder/">Open Live Builder</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
