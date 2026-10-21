import { Code2, Layers, Palette, Sparkles, Variable, Zap } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    eyebrow: 'AI Designer',
    title: 'Describe it. Watch it build.',
    description:
      'The email appears block by block as the AI writes it, in your brand colours and merge tags. Then ask for changes in plain words, for the whole email or one selected block, each one a single undo.',
  },
  {
    icon: Layers,
    eyebrow: 'Visual Editor',
    title: '14 production-tested email blocks.',
    description:
      'Headings, paragraphs, buttons, multi-column layouts, product cards, coupons, countdowns, and social footers — all compiled to table-safe HTML.',
  },
  {
    icon: Code2,
    eyebrow: 'White-Label Embed',
    title: 'Drop into any app via iframe & postMessage.',
    description:
      'Mount the builder inside your SaaS dashboard. Load templates and capture saved JSON + compiled HTML over a clean message bus.',
  },
  {
    icon: Variable,
    eyebrow: 'Dynamic Variables',
    title: 'Organization-scoped merge tags.',
    description:
      'Configure custom variables per organization ({{user_name}}, {{invoice_url}}) so non-technical authors insert valid placeholders every time.',
  },
  {
    icon: Zap,
    eyebrow: 'REST Render API',
    title: 'Compile templates on the fly.',
    description:
      'Call POST /api/v1/render with a template ID and variable payload. Pipe the returned HTML straight into SES, Postmark, Resend, or SendGrid.',
  },
  {
    icon: Palette,
    eyebrow: 'Custom Themes',
    title: 'Match your product chrome.',
    description:
      'Toggle logo visibility, HTML export controls, and light or dark studio themes per organization directly from your dashboard.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-media px-6 sm:px-8">
        <div className="mx-auto max-w-text text-center">
          <p className="text-eyebrow text-muted-foreground">Why MailCraft</p>
          <h2 className="mt-3 text-display-2 font-bold tracking-tight text-foreground text-balance">
            Everything required for email infrastructure.{' '}
            <span className="text-muted-foreground">Nothing bloated.</span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col justify-between rounded-tile border border-border bg-card p-8 sm:p-10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-eyebrow text-marketing-accent">{feature.eyebrow}</p>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="mt-5 text-title-2 font-bold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-body text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
