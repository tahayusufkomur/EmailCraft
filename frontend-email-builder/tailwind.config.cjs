const alphaTokens = (cssVar) =>
  Object.fromEntries(
    [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(
      (n) => [n, `color-mix(in oklch, var(${cssVar}) ${n}%, transparent)`],
    ),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        heading: [
          'Geist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        display: [
          'clamp(2.5rem, 6vw + 0.5rem, 5rem)',
          { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' },
        ],
        'display-2': [
          'clamp(2rem, 4vw + 0.5rem, 3.5rem)',
          { lineHeight: '1.08', letterSpacing: '-0.025em', fontWeight: '700' },
        ],
        title: [
          'clamp(1.375rem, 2vw + 0.5rem, 2rem)',
          { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' },
        ],
        'title-2': [
          'clamp(1.125rem, 1vw + 0.5rem, 1.375rem)',
          { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' },
        ],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        caption: ['0.8125rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        tile: '18px',
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: {
          DEFAULT: 'var(--background)',
          ...alphaTokens('--background'),
        },
        foreground: {
          DEFAULT: 'var(--foreground)',
          ...alphaTokens('--foreground'),
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          ...alphaTokens('--card'),
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
          ...alphaTokens('--popover'),
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          ...alphaTokens('--primary'),
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
          ...alphaTokens('--secondary'),
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
          ...alphaTokens('--muted'),
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
          ...alphaTokens('--accent'),
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
          ...alphaTokens('--destructive'),
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          ...alphaTokens('--success'),
        },
        border: {
          DEFAULT: 'var(--border)',
          ...alphaTokens('--border'),
        },
        input: {
          DEFAULT: 'var(--input)',
          ...alphaTokens('--input'),
        },
        ring: {
          DEFAULT: 'var(--ring)',
          ...alphaTokens('--ring'),
        },
        'marketing-accent': {
          DEFAULT: 'var(--marketing-accent)',
          ...alphaTokens('--marketing-accent'),
        },
      },
    },
  },
  plugins: [],
};
