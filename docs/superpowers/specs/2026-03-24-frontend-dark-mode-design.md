# Frontend Dark Mode — Design Spec

**Date:** 2026-03-24
**Scope:** `frontend/` — public site + dashboard

## Overview

Add dark mode to the main frontend using the existing shadcn/ui CSS variable system. Toggle via navbar button, defaults to system preference, persisted to localStorage.

## Changes

### 1. Tailwind Config
Add `darkMode: 'class'` to `tailwind.config.cjs`.

### 2. Dark CSS Variables
Add `.dark` selector in `index.css` with dark theme HSL values for all existing variables.

### 3. Theme Provider
New file `src/lib/theme.tsx`: ThemeProvider context + useTheme hook.
- Reads `localStorage('mailcraft-theme')`, falls back to system preference
- Applies `.dark` class on `document.documentElement`
- Listens to `matchMedia` changes in system mode
- Exposes `{ theme, setTheme }` — values: `'light' | 'dark' | 'system'`

### 4. Toggle Button
Sun/Moon/Monitor icon button in SiteLayout navbar and DashboardLayout header. Cycles system → light → dark → system.

### 5. Gradient Fixes
Landing page and templates page hardcoded gradients get `dark:` variants.

## Files

| File | Change |
|------|--------|
| `tailwind.config.cjs` | Add `darkMode: 'class'` |
| `src/index.css` | Add `.dark` variables |
| `src/lib/theme.tsx` | New — ThemeProvider + useTheme |
| `src/main.tsx` | Wrap in ThemeProvider |
| `src/components/layout/SiteLayout.tsx` | Add toggle |
| `src/components/layout/DashboardLayout.tsx` | Add toggle |
| `src/pages/LandingPage.tsx` | Dark gradient variants |
| `src/pages/TemplatesPage.tsx` | Dark gradient variants |
