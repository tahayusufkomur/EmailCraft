import { useState } from 'react';
import { motion } from 'framer-motion';

import { AnimateIn } from '../ui/AnimateIn';

const steps = [
  {
    id: 'setup',
    label: '1. Setup',
    title: 'Create an org & configure',
    description: 'Set up a project with variables your users can insert into emails.',
    code: `# Create an org
curl -X POST https://mailcraft.contentor.app/api/site/organizations/ \\
  -H "Authorization: Token YOUR_TOKEN" \\
  -d '{
    "name": "My SaaS",
    "allowed_origins": ["https://app.mysaas.com"]
  }'

# Configure variables for that org
curl -X PATCH https://mailcraft.contentor.app/api/v1/email/setup \\
  -H "X-API-Key: mk_live_..." \\
  -d '{
    "available_variables": [
      { "key": "customer_name", "label": "Customer Name", "type": "text" },
      { "key": "unsubscribe_url", "label": "Unsubscribe", "type": "url" }
    ]
  }'`,
  },
  {
    id: 'embed',
    label: '2. Embed',
    title: 'Drop the builder into your app',
    description: 'One iframe with your API key. Users build emails with drag & drop.',
    code: `<!-- Add the SDK loader -->
<script src="https://mailcraft.contentor.app/loader.js"></script>

<!-- Initialize the builder -->
<script>
  MailCraft.init({
    apiKey: "mk_live_...",
    container: "#editor",
    variables: true,        // enable variable insertion
    theme: "light-breeze",  // or "dark-cosmos"
    onSave: (data) => {
      // data.html  — rendered email HTML
      // data.json  — template JSON for re-editing
      console.log("Template saved", data);
    }
  });
</script>

<div id="editor" style="height: 100vh;"></div>`,
  },
  {
    id: 'export',
    label: '3. Export',
    title: 'Render HTML with live data',
    description: 'Call the API to get production-ready HTML with variables replaced.',
    code: `# Export with placeholder tokens (for your sending system)
curl -X POST https://mailcraft.contentor.app/api/v1/export/html \\
  -H "X-API-Key: mk_live_..." \\
  -d '{
    "json_data": { ... },
    "variables_mode": "placeholders"
  }'

# Or render with real values (ready to send)
curl -X POST https://mailcraft.contentor.app/api/v1/render \\
  -H "X-API-Key: mk_live_..." \\
  -d '{
    "template_id": "tmpl_abc123",
    "variables": {
      "customer_name": "Jane Doe",
      "unsubscribe_url": "https://app.mysaas.com/unsub/xyz"
    }
  }'

# Response: { "html": "<!DOCTYPE html>...", "variables_used": [...] }`,
  },
] as const;

type StepId = (typeof steps)[number]['id'];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<StepId>('setup');
  const active = steps.find((s) => s.id === activeStep)!;

  return (
    <section className="border-y border-border/60 bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
        <AnimateIn className="text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Built for developers
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            From zero to sending emails in three API calls.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.15} className="mt-12">
          {/* Step tabs */}
          <div className="flex justify-center">
            <div className="inline-flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeStep === step.id
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {activeStep === step.id && (
                    <motion.span
                      layoutId="howitworks-tab-bg"
                      className="absolute inset-0 rounded-md border-b-2 border-primary bg-background shadow-sm"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{step.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="mt-8">
            <div className="mb-4 text-center">
              <h3 className="font-heading text-xl font-semibold">{active.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{active.description}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-[hsl(222_26%_10%)] shadow-glow">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-xs text-white/40 font-mono">terminal</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-[#e4e4e7]">
                <code>{active.code}</code>
              </pre>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
