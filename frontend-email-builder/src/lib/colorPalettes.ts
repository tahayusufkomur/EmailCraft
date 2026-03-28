export interface ColorPalette {
  name: string;
  slug: string;
  primary: string;
  secondary: string;
  textDark: string;
  textLight: string;
  background: string;
  surface: string;
}

export const PALETTES: ColorPalette[] = [
  {
    slug: 'meridian-coffee',
    name: 'Meridian Coffee',
    primary: '#271310',
    secondary: '#735c00',
    textDark: '#1a1c1a',
    textLight: '#504442',
    background: '#ffffff',
    surface: '#f4f3f1',
  },
  {
    slug: 'sunrise-yoga',
    name: 'Sunrise Yoga',
    primary: '#8c4a00',
    secondary: '#fd8b00',
    textDark: '#322e2b',
    textLight: '#605a57',
    background: '#ffffff',
    surface: '#f8efea',
  },
  {
    slug: 'zenith-teal',
    name: 'Zenith Teal',
    primary: '#406660',
    secondary: '#c5ebdd',
    textDark: '#2e3432',
    textLight: '#5a605e',
    background: '#ffffff',
    surface: '#f2f4f2',
  },
  {
    slug: 'corporate-blue',
    name: 'Corporate Blue',
    primary: '#2563eb',
    secondary: '#3b82f6',
    textDark: '#1e293b',
    textLight: '#64748b',
    background: '#ffffff',
    surface: '#f1f5f9',
  },
  {
    slug: 'warm-sunset',
    name: 'Warm Sunset',
    primary: '#dc2626',
    secondary: '#f97316',
    textDark: '#292524',
    textLight: '#78716c',
    background: '#ffffff',
    surface: '#fef2f2',
  },
  {
    slug: 'forest-green',
    name: 'Forest Green',
    primary: '#16a34a',
    secondary: '#86efac',
    textDark: '#14532d',
    textLight: '#4b5563',
    background: '#ffffff',
    surface: '#f0fdf4',
  },
  {
    slug: 'elegant-purple',
    name: 'Elegant Purple',
    primary: '#7c3aed',
    secondary: '#a78bfa',
    textDark: '#1e1b4b',
    textLight: '#6b7280',
    background: '#ffffff',
    surface: '#f5f3ff',
  },
  {
    slug: 'minimal-gray',
    name: 'Minimal Gray',
    primary: '#374151',
    secondary: '#9ca3af',
    textDark: '#111827',
    textLight: '#6b7280',
    background: '#ffffff',
    surface: '#f9fafb',
  },
  {
    slug: 'dark-mode',
    name: 'Dark Mode',
    primary: '#6366f1',
    secondary: '#818cf8',
    textDark: '#f9fafb',
    textLight: '#d1d5db',
    background: '#111827',
    surface: '#1f2937',
  },
  {
    slug: 'rose-gold',
    name: 'Rose Gold',
    primary: '#be185d',
    secondary: '#f9a8d4',
    textDark: '#1c1917',
    textLight: '#78716c',
    background: '#ffffff',
    surface: '#fff1f2',
  },
];

export function getPaletteBySlug(slug: string): ColorPalette | undefined {
  return PALETTES.find((p) => p.slug === slug);
}
