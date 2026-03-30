import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AnimateIn } from '../ui/AnimateIn';
import { Button } from '../ui/button';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-[radial-gradient(ellipse_at_top,_hsl(33_95%_57%_/_0.25),transparent_50%),radial-gradient(ellipse_at_80%_60%,_hsl(205_90%_58%_/_0.2),transparent_50%),radial-gradient(ellipse_at_20%_80%,_hsl(33_95%_57%_/_0.12),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_top,_hsl(33_95%_57%_/_0.12),transparent_50%),radial-gradient(ellipse_at_80%_60%,_hsl(205_90%_58%_/_0.08),transparent_50%),radial-gradient(ellipse_at_20%_80%,_hsl(33_95%_57%_/_0.05),transparent_40%)] px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <AnimateIn>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Ship email from your product
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Get your API key and start building &mdash; free tier included.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <Button
            asChild
            size="lg"
          >
            <Link to="/login">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </AnimateIn>
      </div>
    </section>
  );
}
