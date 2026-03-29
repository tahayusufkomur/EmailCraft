import { Code2, LayoutGrid, Image as ImageIcon, Shield } from 'lucide-react';

import { AnimateIn } from '../ui/AnimateIn';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';

const features = [
  {
    icon: Code2,
    accent: 'bg-primary',
    title: 'Email-safe HTML export',
    description:
      'Table-based layout, inline CSS, and VML for Outlook. Your templates render perfectly in every email client.',
  },
  {
    icon: LayoutGrid,
    accent: 'bg-secondary',
    title: 'Template gallery',
    description:
      'Pre-built templates your users start from. 13 block types with drag-and-drop customization.',
  },
  {
    icon: ImageIcon,
    accent: 'bg-[#22c55e]',
    title: 'Media management',
    description:
      'S3-backed uploads with presigned URLs. Per-organization storage isolation and CDN delivery.',
  },
  {
    icon: Shield,
    accent: 'bg-[#a855f7]',
    title: 'Multi-tenant API',
    description:
      'API key auth with SHA-256 hashing. Org-scoped data, session tokens, and origin validation.',
  },
] as const;

export function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <AnimateIn direction="up" className="text-center">
          <h2 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
            Everything you need to ship email
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Production-ready email building, embedded in your product.
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
