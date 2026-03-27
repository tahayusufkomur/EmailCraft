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

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/templates', label: 'Templates' },
  { to: '/docs', label: 'Docs' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/faq', label: 'FAQ' },
  { to: '/impressum', label: 'Impressum' },
];

export function SiteLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-foreground">
            MailCraft
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('text-sm text-muted-foreground transition hover:text-foreground', isActive && 'text-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
            <a href="/builder/" className="text-sm text-muted-foreground transition hover:text-foreground">
              Builder
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
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
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>MailCraft © {new Date().getFullYear()}.</p>
          <div className="flex items-center gap-4">
            <Link to="/impressum" className="hover:text-foreground">Impressum</Link>
            <Link to="/faq" className="hover:text-foreground">FAQ</Link>
            <a href="/builder/" className="hover:text-foreground">Email Builder</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
