import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AnimateIn } from '../ui/AnimateIn';
import { Button } from '../ui/button';

export function CtaSection() {
  return (
    <section className="animate-gradient bg-gradient-to-br from-[hsl(205_89%_44%)] via-[hsl(205_89%_50%)] to-[hsl(24_85%_58%)] px-4 py-20 md:py-28">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <AnimateIn>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Ship email from your product
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            Get your API key and start building &mdash; free tier included.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.2}>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-white text-foreground hover:bg-white/90"
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
