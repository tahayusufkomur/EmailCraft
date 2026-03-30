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
];

export function SiteLayout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <span className="font-heading text-lg font-bold text-foreground">MailCraft</span>
              <p className="mt-2 text-sm text-muted-foreground">
                Embeddable email template builder for product teams. Drag, drop, ship.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/builder/" className="transition hover:text-foreground">Builder</a></li>
                <li><Link to="/templates" className="transition hover:text-foreground">Templates</Link></li>
                <li><Link to="/pricing" className="transition hover:text-foreground">Pricing</Link></li>
                <li><Link to="/docs" className="transition hover:text-foreground">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/faq" className="transition hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/docs#api-reference" className="transition hover:text-foreground">API Reference</Link></li>
                <li><Link to="/docs#embedding" className="transition hover:text-foreground">Embedding Guide</Link></li>
                <li><Link to="/docs#postmessage" className="transition hover:text-foreground">postMessage API</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground md:flex-row">
            <p>MailCraft © {new Date().getFullYear()}. All rights reserved.</p>
            <p>Built with care for email developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
