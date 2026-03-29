import { AnimateIn } from '../ui/AnimateIn';

const stats = [
  { value: '3', label: 'API calls to go live' },
  { value: '13', label: 'Block types' },
  { value: 'REST', label: 'Programmable API' },
  { value: '∞', label: 'Orgs & projects' },
] as const;

export function StatsBar() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:py-14">
        {stats.map((stat, index) => (
          <AnimateIn
            key={stat.label}
            delay={index * 0.1}
            className="flex flex-col items-center text-center"
          >
            <span className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              {stat.value}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
