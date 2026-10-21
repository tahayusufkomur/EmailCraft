import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { Wordmark } from '../shared/logo-mark';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';

const navLinks = [
  { to: '/templates', label: 'Templates' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/faq', label: 'FAQ' },
];

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Email Builder', to: '/builder/', external: true },
      { label: 'Templates', to: '/templates' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Documentation', to: '/docs' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Quickstart', to: '/docs' },
      { label: 'Embed Widget', to: '/docs' },
      { label: 'REST Render API', to: '/docs' },
      { label: 'Template Variables', to: '/docs' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Template Gallery', to: '/templates' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign In', to: '/login' },
      { label: 'Get Started', to: '/register' },
      { label: 'Organizations', to: '/dashboard/organizations' },
      { label: 'Billing', to: '/dashboard/billing' },
    ],
  },
];

export function SiteLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <Wordmark size="sm" />
            </Link>

            <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'text-xs transition-colors',
                      isActive
                        ? 'font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href="/builder/"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Live Demo
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full px-3.5 text-xs"
                  onClick={logout}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="h-7 rounded-full px-3.5 text-xs" asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <a
                href="/builder/"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Live Demo
              </a>

              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="w-full justify-center" asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center"
                      onClick={logout}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="w-full justify-center" asChild>
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button size="sm" className="w-full justify-center rounded-full" asChild>
                      <Link to="/register">Get started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted text-xs text-muted-foreground">
        <div className="mx-auto max-w-[980px] px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 border-b border-border py-10 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-3 font-semibold text-foreground">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.to}
                          className="transition-colors hover:text-foreground hover:underline"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="transition-colors hover:text-foreground hover:underline"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between gap-3 py-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Wordmark size="sm" />
              <span>&copy; {new Date().getFullYear()} MailCraft. All rights reserved.</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <Link to="/docs" className="transition-colors hover:text-foreground hover:underline">
                API Reference
              </Link>
              <Link to="/pricing" className="transition-colors hover:text-foreground hover:underline">
                Pricing
              </Link>
              <Link to="/faq" className="transition-colors hover:text-foreground hover:underline">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
