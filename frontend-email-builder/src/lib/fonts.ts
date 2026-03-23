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
  // Google Fonts
  { label: 'Noto Serif', value: "'Noto Serif', Georgia, serif", isGoogle: true },
  { label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', Arial, sans-serif", isGoogle: true },
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
];

const GOOGLE_FONT_SLUG: Record<string, string> = {
  'Noto Serif': 'Noto+Serif:wght@400;700',
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@300;400;500;600;700',
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
};

/** Extract Google Font names used in a font-family string */
function extractGoogleFontName(fontFamily: string): string | null {
  for (const name of Object.keys(GOOGLE_FONT_SLUG)) {
    if (fontFamily.includes(name)) return name;
  }
  return null;
}

/** Collect all Google Font link tags needed for a set of font-family values */
export function getGoogleFontLinks(fontFamilies: string[]): string {
  const names = new Set<string>();
  for (const ff of fontFamilies) {
    const name = extractGoogleFontName(ff);
    if (name) names.add(name);
  }
  if (names.size === 0) return '';
  const families = Array.from(names).map((n) => GOOGLE_FONT_SLUG[n]).join('&family=');
  return `<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
}

/** Scan a template and return all font families used */
export function collectTemplateFonts(template: { settings: { defaultFont: string }; header: { blocks: unknown[] }; body: { blocks: unknown[] }; footer: { blocks: unknown[] } }): string[] {
  const fonts = new Set<string>();
  fonts.add(template.settings.defaultFont);

  const scanBlocks = (blocks: unknown[]) => {
    for (const block of blocks) {
      const b = block as Record<string, unknown>;
      const style = b.style as Record<string, unknown> | undefined;
      if (style?.fontFamily) fonts.add(style.fontFamily as string);
      if (style?.headingFontFamily) fonts.add(style.headingFontFamily as string);
      const data = b.data as Record<string, unknown> | undefined;
      if (data?.columns && Array.isArray(data.columns)) {
        for (const col of data.columns as { blocks: unknown[] }[]) {
          scanBlocks(col.blocks);
        }
      }
    }
  };

  scanBlocks(template.header.blocks);
  scanBlocks(template.body.blocks);
  scanBlocks(template.footer.blocks);
  return Array.from(fonts);
}
