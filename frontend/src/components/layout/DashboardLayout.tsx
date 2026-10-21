import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Wand2,
  X,
} from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { Mark, Wordmark } from '../shared/logo-mark';
import { Separator } from '../ui/separator';
import { ThemeToggle } from '../ui/theme-toggle';

const navLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { to: '/dashboard/email-builder', label: 'Email Builder', icon: Wand2 },
  { to: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { to: '/dashboard/docs', label: 'Documentation', icon: BookOpen },
];

export function DashboardLayout() {
  const { user, organization, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarContent = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-3',
          isCollapsed ? 'justify-center' : 'justify-between',
        )}
      >
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          {isCollapsed ? <Mark size={24} /> : <Wordmark size="sm" />}
        </Link>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:inline-flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand trigger when collapsed */}
      {isCollapsed && (
        <div className="hidden justify-center border-b border-sidebar-border py-2 md:flex">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Workspace badge */}
      {!isCollapsed && organization && (
        <div className="px-4 pt-4 pb-1">
          <p className="text-eyebrow text-muted-foreground">Workspace</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
            {organization.name}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              title={isCollapsed ? link.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center px-0',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}

        <Separator className="my-3" />

        <a
          href="/builder/"
          title={isCollapsed ? 'Standalone Studio' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            isCollapsed && 'justify-center px-0',
          )}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">Open Studio</span>}
        </a>
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-sidebar-border p-3">
        <div
          className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center' : 'justify-between px-1',
          )}
        >
          {!isCollapsed && (
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Website
            </Link>
          )}
          <ThemeToggle />
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-2',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.username || 'Account'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {sidebarContent(collapsed)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r border-sidebar-border bg-sidebar">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Wordmark size="sm" />
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
