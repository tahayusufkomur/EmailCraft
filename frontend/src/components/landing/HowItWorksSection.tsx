const steps = [
  {
    number: '01',
    title: 'Create an organization & API key',
    description:
      'Sign up, define your organization merge variables, and choose your white-label builder theme.',
  },
  {
    number: '02',
    title: 'Design visually or embed the editor',
    description:
      'Build templates in the standalone studio or embed the iframe inside your application with postMessage events.',
  },
  {
    number: '03',
    title: 'Render via REST API & send anywhere',
    description:
      'Pass template IDs and runtime variables to /api/v1/render and deliver the compiled HTML through your ESP.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="dark bg-background py-20 text-foreground sm:py-28 lg:py-36">
      <div className="mx-auto max-w-media px-6 sm:px-8">
        <div className="mx-auto max-w-text text-center">
          <p className="text-eyebrow text-marketing-accent">Developer Workflow</p>
          <h2 className="mt-3 text-display-2 font-bold tracking-tight text-foreground text-balance">
            From visual blocks to delivered HTML in three steps.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-body-lg text-muted-foreground">
            Built for engineering teams who want clean JSON schemas, predictable HTML tables, and a
            zero-maintenance embed.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-tile border border-border bg-card p-8 sm:p-10"
            >
              <span className="font-mono text-xs font-semibold text-marketing-accent">
                STEP {step.number}
              </span>
              <h3 className="mt-4 text-title-2 font-bold text-foreground">{step.title}</h3>
              <p className="mt-3 text-body text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Code showcase */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-tile border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
              <span className="font-mono text-xs text-muted-foreground">
                1. Listen for saved templates (postMessage)
              </span>
              <span className="font-mono text-[11px] text-marketing-accent">TypeScript</span>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-xs leading-relaxed text-foreground/90">
              <code>{`window.addEventListener('message', (event) => {
  if (event.data?.source !== 'mailcraft') return;

  if (event.data.type === 'MAILCRAFT_SAVE') {
    const { html, json } = event.data.payload;
    await saveTemplateToDatabase({ html, json });
  }
});`}</code>
            </pre>
          </div>

          <div className="overflow-hidden rounded-tile border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
              <span className="font-mono text-xs text-muted-foreground">
                2. Render with runtime variables (REST API)
              </span>
              <span className="font-mono text-[11px] text-marketing-accent">cURL</span>
            </div>
            <pre className="overflow-x-auto p-6 font-mono text-xs leading-relaxed text-foreground/90">
              <code>{`curl -X POST https://mailcraft.contentor.app/api/v1/render \\
  -H "X-API-Key: mc_live_9f8a7b6c..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tpl_welcome_01",
    "variables": { "first_name": "Ada", "plan": "Pro" }
  }'`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
