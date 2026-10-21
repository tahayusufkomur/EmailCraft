const stats = [
  { value: '14', label: 'Typed email block primitives' },
  { value: '< 50ms', label: 'Server-side variable render latency' },
  { value: '5 min', label: 'Iframe + postMessage integration' },
  { value: '100%', label: 'Table-based email client compatibility' },
];

export function StatsBar() {
  return (
    <section className="border-y border-border bg-muted/50 py-12 sm:py-16">
      <div className="mx-auto max-w-media px-6 sm:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-caption text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
