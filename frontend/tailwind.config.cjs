/** @type {import('tailwindcss').Config} */

function alphaTokens(colors) {
  const leaf =
    (token) =>
    ({ opacityVariable, opacityValue } = {}) =>
      opacityValue === undefined || opacityVariable
        ? token
        : `color-mix(in oklab, ${token} calc(${opacityValue} * 100%), transparent)`;
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) => [
      key,
      typeof value === 'string' ? leaf(value) : alphaTokens(value),
    ]),
  );
}

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        display: [
          'clamp(56px, 4.2vw + 24px, 80px)',
          { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' },
        ],
        'display-2': [
          'clamp(40px, 3.1vw + 12px, 56px)',
          { lineHeight: '1.07', letterSpacing: '-0.028em', fontWeight: '600' },
        ],
        title: [
          'clamp(32px, 1.4vw + 20px, 40px)',
          { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' },
        ],
        'title-2': [
          'clamp(24px, 0.7vw + 18px, 28px)',
          { lineHeight: '1.14', letterSpacing: '-0.015em', fontWeight: '600' },
        ],
        'body-lg': [
          'clamp(19px, 0.5vw + 14px, 21px)',
          { lineHeight: '1.4', letterSpacing: '-0.01em' },
        ],
        body: ['17px', { lineHeight: '1.47', letterSpacing: '-0.01em' }],
        caption: ['14px', { lineHeight: '1.43' }],
      },
      maxWidth: { text: '980px', media: '1440px' },
      screens: { stage: { raw: '(min-width: 768px) and (min-height: 600px)' } },
      transitionTimingFunction: { expo: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      aria: { invalid: 'invalid="true"' },
      colors: alphaTokens({
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        'marketing-accent': {
          DEFAULT: 'var(--marketing-accent)',
          foreground: 'var(--marketing-accent-foreground)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
      }),
      borderRadius: {
        tile: '18px',
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
        '4xl': 'calc(var(--radius) + 16px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        display: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        heading: ['var(--font-geist-sans)', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Geist Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
        busy: {
          '0%': { boxShadow: '0 0 0 0 var(--busy-color, currentColor)' },
          '70%': { boxShadow: '0 0 0 6px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' },
        },
        reveal: {
          from: {
            opacity: '0',
            transform: 'translate(var(--reveal-x, 0), var(--reveal-y, 24px))',
          },
          to: { opacity: '1', transform: 'translate(0, 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-in-up': 'fade-in-up 0.2s ease-out both',
        'progress-indeterminate': 'progress-indeterminate 1.1s ease-in-out infinite',
        busy: 'busy 1.6s ease-out infinite',
        reveal: 'reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 30s linear infinite',
        'scale-in': 'scale-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      backdropBlur: {
        xs: '4px',
        '4xl': '72px',
      },
    },
  },
  plugins: [],
};
