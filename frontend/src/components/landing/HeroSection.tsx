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
            <div className="animate-float shadow-glow rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                  <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
                </div>
                <div className="mx-auto flex-1 max-w-sm">
                  <div className="rounded-md bg-muted/60 px-3 py-1 text-center text-xs text-muted-foreground">
                    mailcraft.contentor.app/builder
                  </div>
                </div>
                <div className="w-[52px]" />
              </div>

              <div className="p-3">
                <div className="grid h-64 grid-cols-[180px_1fr_200px] gap-3 sm:h-72 md:h-80">
                  <div className="hidden rounded-lg bg-white/[0.07] p-3 dark:bg-white/[0.04] sm:block">
                    <div className="mb-3 h-2 w-16 rounded bg-white/10" />
                    <div className="space-y-2">
                      {['Text', 'Image', 'Button', 'Divider', 'Columns', 'Social'].map((label) => (
                        <div
                          key={label}
                          className="flex items-center gap-2 rounded-md bg-white/[0.06] px-2 py-1.5 text-[10px] text-muted-foreground dark:bg-white/[0.03]"
                        >
                          <div className="h-3 w-3 rounded bg-primary/30" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10">
                    <div className="mb-4 h-3 w-2/3 rounded bg-white/10" />
                    <div className="mb-2 h-2 w-1/2 rounded bg-white/[0.07]" />
                    <div className="mb-6 h-2 w-1/3 rounded bg-white/[0.07]" />
                    <p className="text-sm font-medium text-muted-foreground/70">
                      Email Builder Preview
                    </p>
                    <div className="mt-4 flex gap-2">
                      <div className="h-6 w-20 rounded bg-primary/20" />
                      <div className="h-6 w-16 rounded bg-white/[0.06]" />
                    </div>
                  </div>

                  <div className="hidden rounded-lg bg-white/[0.07] p-3 dark:bg-white/[0.04] md:block">
                    <div className="mb-3 h-2 w-12 rounded bg-white/10" />
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 h-1.5 w-10 rounded bg-white/10" />
                        <div className="h-6 rounded bg-white/[0.06]" />
                      </div>
                      <div>
                        <div className="mb-1 h-1.5 w-14 rounded bg-white/10" />
                        <div className="h-6 rounded bg-white/[0.06]" />
                      </div>
                      <div>
                        <div className="mb-1 h-1.5 w-8 rounded bg-white/10" />
                        <div className="flex gap-1">
                          <div className="h-5 w-5 rounded bg-primary/20" />
                          <div className="h-5 w-5 rounded bg-secondary/20" />
                          <div className="h-5 w-5 rounded bg-white/[0.06]" />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 h-1.5 w-12 rounded bg-white/10" />
                        <div className="h-6 rounded bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
