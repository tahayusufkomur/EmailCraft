import { Link, NavLink, Outlet } from 'react-router-dom';
import { Sun, Moon, Monitor } from 'lucide-react';

import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
  const Icon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;
  return (
    <Button variant="ghost" size="sm" onClick={() => setTheme(next)} title={`Theme: ${theme}`}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}

const links = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/organizations', label: 'Organizations' },
  { to: '/dashboard/email-builder', label: 'Email Builder' },
  { to: '/dashboard/billing', label: 'Billing' },
];

export function DashboardLayout() {
  const { organization, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center justify-between px-4">
          <div>
            <p className="font-heading text-lg font-semibold">Dashboard</p>
            <p className="text-xs text-muted-foreground">{organization?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="outline">
              <Link to="/">Website</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void logout();
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1800px] gap-8 px-4 py-8 md:grid-cols-[200px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-card p-2">
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
