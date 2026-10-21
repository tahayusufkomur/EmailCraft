export interface FontOption {
  label: string;
  value: string;
  isGoogle?: boolean;
}

export const FONT_OPTIONS: FontOption[] = [
  // Web-safe fonts
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', Times, serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Helvetica', value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  // Google Fonts
  { label: 'Noto Serif', value: "'Noto Serif', Georgia, serif", isGoogle: true },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', Arial, sans-serif", isGoogle: true },
  { label: 'Be Vietnam Pro', value: "'Be Vietnam Pro', Arial, sans-serif", isGoogle: true },
  { label: 'Inter', value: "'Inter', Arial, sans-serif", isGoogle: true },
  { label: 'Playfair Display', value: "'Playfair Display', Georgia, serif", isGoogle: true },
  { label: 'Lora', value: "'Lora', Georgia, serif", isGoogle: true },
  { label: 'Montserrat', value: "'Montserrat', Arial, sans-serif", isGoogle: true },
  { label: 'Open Sans', value: "'Open Sans', Arial, sans-serif", isGoogle: true },
  { label: 'Raleway', value: "'Raleway', Arial, sans-serif", isGoogle: true },
  { label: 'Poppins', value: "'Poppins', Arial, sans-serif", isGoogle: true },
  { label: 'Roboto', value: "'Roboto', Arial, sans-serif", isGoogle: true },
  { label: 'DM Sans', value: "'DM Sans', Arial, sans-serif", isGoogle: true },
  { label: 'Source Serif 4', value: "'Source Serif 4', Georgia, serif", isGoogle: true },
  { label: 'Merriweather', value: "'Merriweather', Georgia, serif", isGoogle: true },
  { label: 'Archivo', value: "'Archivo', 'Helvetica Neue', Arial, sans-serif", isGoogle: true },
  { label: 'Alfa Slab One', value: "'Alfa Slab One', Rockwell, Georgia, serif", isGoogle: true },
  { label: 'Barlow Condensed', value: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif", isGoogle: true },
  { label: 'Big Shoulders Stencil', value: "'Big Shoulders Stencil', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif", isGoogle: true },
  { label: 'Bungee', value: "'Bungee', 'Helvetica Neue', Arial, sans-serif", isGoogle: true },
  { label: 'Courier Prime', value: "'Courier Prime', 'Courier New', Courier, monospace", isGoogle: true },
  { label: 'EB Garamond', value: "'EB Garamond', Garamond, Georgia, serif", isGoogle: true },
  { label: 'Overpass', value: "'Overpass', 'Helvetica Neue', Arial, sans-serif", isGoogle: true },
  { label: 'Press Start 2P', value: "'Press Start 2P', Monaco, Consolas, 'Lucida Console', 'Courier New', monospace", isGoogle: true },
  { label: 'Silkscreen', value: "'Silkscreen', Monaco, Consolas, 'Lucida Console', 'Courier New', monospace", isGoogle: true },
];

const GOOGLE_FONT_SLUG: Record<string, string> = {
  'Noto Serif': 'Noto+Serif:wght@400;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@300;400;500;600;700',
  'Be Vietnam Pro': 'Be+Vietnam+Pro:wght@300;400;500;600;700',
  'Inter': 'Inter:wght@300;400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;700',
  'Lora': 'Lora:wght@400;700',
  'Montserrat': 'Montserrat:wght@300;400;500;600;700',
  'Open Sans': 'Open+Sans:wght@300;400;600;700',
  'Raleway': 'Raleway:wght@300;400;500;600;700',
  'Poppins': 'Poppins:wght@300;400;500;600;700',
  'Roboto': 'Roboto:wght@300;400;500;700',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  'Source Serif 4': 'Source+Serif+4:wght@400;600;700',
  'Merriweather': 'Merriweather:wght@400;700',
  'Archivo': 'Archivo:wght@400;500;600;700;800',
  'Alfa Slab One': 'Alfa+Slab+One',
  'Barlow Condensed': 'Barlow+Condensed:wght@400;500;600;700',
  'Big Shoulders Stencil': 'Big+Shoulders+Stencil:wght@700;800',
  'Bungee': 'Bungee',
  'Courier Prime': 'Courier+Prime:wght@400;700',
  'EB Garamond': 'EB+Garamond:ital,wght@0,400;0,600;1,400',
  'Overpass': 'Overpass:wght@400;600;700;800',
  'Press Start 2P': 'Press+Start+2P',
  'Silkscreen': 'Silkscreen:wght@400;700',
};

/** Collect all Google Font link tags needed for a set of font-family values */
export function getGoogleFontLinks(fontFamilies: string[]): string {
  const names = new Set<string>();
  for (const ff of fontFamilies) {
    for (const name of Object.keys(GOOGLE_FONT_SLUG)) {
      if (ff.includes(name)) names.add(name);
    }
  }
  if (names.size === 0) return '';
  const families = Array.from(names).sort().map((n) => GOOGLE_FONT_SLUG[n]).join('&family=');
  return `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}

const FONT_DECL = /font-family\s*:\s*([^;"]+)/gi;

/**
 * Every font family a template names: any *fontFamily / defaultFont style value, plus
 * font-family declarations inside rich-text HTML. Mirrors _collect_google_font_links on the server.
 */
export function collectTemplateFonts(template: unknown): string[] {
  const fonts: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string' && (k.toLowerCase().endsWith('fontfamily') || k === 'defaultFont')) fonts.push(v);
        walk(v);
      }
    } else if (typeof node === 'string' && node.toLowerCase().includes('font-family')) {
      for (const m of node.matchAll(FONT_DECL)) fonts.push(m[1]);
    }
  };
  walk(template);
  return fonts;
}
