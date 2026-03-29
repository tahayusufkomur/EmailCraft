import { Code2, Variable, Building2, Palette } from 'lucide-react';

import { AnimateIn } from '../ui/AnimateIn';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';

const features = [
  {
    icon: Code2,
    accent: 'bg-primary',
    title: 'Programmable HTML export',
    description:
      'Get production-ready email HTML via REST API. Table-based layout, inline CSS, VML for Outlook — renders perfectly in every client.',
    code: 'POST /api/v1/render\n{ "template_id": "...", "variables": { "name": "Jane" } }',
  },
  {
    icon: Variable,
    accent: 'bg-secondary',
    title: 'Dynamic variables',
    description:
      'Define variables per org — your users insert them via the builder. Render with real values at send time through the API.',
    code: 'PATCH /api/v1/email/setup\n{ "available_variables": [\n  { "key": "customer_name", "label": "Name" }\n] }',
  },
  {
    icon: Building2,
    accent: 'bg-[#22c55e]',
    title: 'Multi-project orgs',
    description:
      'Spin up isolated orgs programmatically. Each gets its own templates, media storage, API keys, and variable config.',
    code: 'POST /api/site/organizations/\n{ "name": "Acme Corp",\n  "allowed_origins": ["https://acme.com"] }',
  },
  {
    icon: Palette,
    accent: 'bg-[#a855f7]',
    title: 'White-label themes',
    description:
      'Configure builder theme, email backgrounds, color palettes, and logo visibility per org. Make it look like yours.',
    code: 'PATCH /api/site/organizations/:id/\n{ "builder_theme": "dark-cosmos",\n  "theme_mode": "dark" }',
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <AnimateIn direction="up" className="text-center">
          <h2 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
            Everything is an API call
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Embed the builder, configure it, and export HTML — all programmatically.
          </p>
        </AnimateIn>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <AnimateIn key={feature.title} direction="up" delay={index * 0.1}>
                <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className={`h-1 ${feature.accent}`} />
                  <CardHeader>
                    <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                    <div className="mt-3 rounded-lg bg-foreground/[0.04] p-3 dark:bg-foreground/[0.08]">
                      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-muted-foreground">
                        <code>{feature.code}</code>
                      </pre>
                    </div>
                  </CardHeader>
                </Card>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
