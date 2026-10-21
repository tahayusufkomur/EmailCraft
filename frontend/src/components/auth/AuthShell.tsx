import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Wordmark } from '../shared/logo-mark';

const highlights = [
  'Visual drag-and-drop email builder with 14 typed blocks',
  'White-label iframe embed with postMessage & session tokens',
  'Fast REST render API with organization merge variables',
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left — Editorial Dark Brand Panel */}
      <div className="dark hidden flex-col justify-between bg-background p-12 text-foreground lg:flex xl:p-16">
        <Link to="/" className="inline-flex">
          <Wordmark size="md" />
        </Link>

        <div className="max-w-md space-y-6">
          <p className="text-eyebrow text-marketing-accent">Email Infrastructure</p>
          <h2 className="text-display-2 font-bold tracking-tight text-foreground">
            One studio. Every transactional &amp; marketing email.
          </h2>
          <ul className="space-y-3 pt-2">
            {highlights.map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-body text-muted-foreground">
                <span className="mt-0.5 font-mono text-xs font-semibold text-marketing-accent">
                  0{i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-caption text-muted-foreground">
          &copy; {new Date().getFullYear()} MailCraft
        </p>
      </div>

      {/* Right — Form Column */}
      <div className="flex flex-col justify-between p-6 sm:p-12">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="inline-flex">
            <Wordmark size="sm" />
          </Link>
        </div>
        <div className="hidden lg:block" />

        <div className="mx-auto w-full max-w-sm space-y-8 py-8">
          <div className="space-y-2">
            <h1 className="text-title font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
