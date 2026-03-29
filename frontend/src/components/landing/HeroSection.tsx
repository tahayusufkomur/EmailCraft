import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../ui/button';

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: EASE },
  }),
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-[radial-gradient(ellipse_at_top,_hsl(205_90%_58%_/_0.22),transparent_50%),radial-gradient(ellipse_at_80%_60%,_hsl(33_95%_57%_/_0.2),transparent_50%),radial-gradient(ellipse_at_20%_80%,_hsl(205_90%_58%_/_0.1),transparent_40%)] dark:bg-[radial-gradient(ellipse_at_top,_hsl(205_90%_58%_/_0.12),transparent_50%),radial-gradient(ellipse_at_80%_60%,_hsl(33_95%_57%_/_0.08),transparent_50%),radial-gradient(ellipse_at_20%_80%,_hsl(205_90%_58%_/_0.05),transparent_40%)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-24 md:py-32">
        <motion.div
          className="flex flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.p
            custom={0}
            variants={fadeUp}
            className="mb-6 inline-flex rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm"
          >
            Built for product teams shipping email at scale
          </motion.p>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="max-w-4xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Build and ship email templates{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              quickly
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg"
          >
            Drag, drop, and export production-safe email HTML. Embed the builder in your app with one
            iframe.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link to="/login">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">View pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="/builder/">Open builder</a>
            </Button>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            className="mt-16 w-full max-w-4xl"
          >
            <div className="animate-float shadow-glow overflow-hidden rounded-xl border border-border/60">
              <img
                src="/screenshots/builder.avif"
                alt="MailCraft email builder with drag-and-drop template editor"
                className="w-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
