import { AnimateIn } from '../ui/AnimateIn';

const steps = [
  {
    number: 1,
    title: 'Embed',
    description: 'Add one iframe to your app.',
    code: '<iframe src="mailcraft.contentor.app/builder/?apiKey=YOUR_KEY" />',
  },
  {
    number: 2,
    title: 'Customize',
    description: 'Your users build emails with drag & drop.',
    code: "window.addEventListener('message', (e) => {\n  if (e.data.type === 'MAILCRAFT_SAVE') ...\n})",
  },
  {
    number: 3,
    title: 'Ship',
    description: 'Export HTML and render with variables.',
    code: 'POST /api/v1/render\n{ template_id, variables: { name: "Jane" } }',
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="border-y border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <AnimateIn className="text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Integrate in minutes
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Three steps to email building in your product.
          </p>
        </AnimateIn>

        <div className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
          {/* Dashed connecting line (desktop only) */}
          <div
            className="pointer-events-none absolute top-6 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] hidden border-t-2 border-dashed border-primary/30 md:block"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <AnimateIn
              key={step.number}
              delay={index * 0.15}
              className="relative flex flex-col items-center text-center md:px-6"
            >
              {/* Numbered circle */}
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-sm">
                {step.number}
              </div>

              <h3 className="mt-5 font-heading text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>

              {/* Code snippet */}
              <div className="mt-4 w-full max-w-sm rounded-lg bg-foreground/[0.04] p-3 dark:bg-foreground/[0.08]">
                <pre className="overflow-x-auto text-left font-mono text-xs leading-relaxed text-muted-foreground">
                  <code>{step.code}</code>
                </pre>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
