import type { Block, BlockType } from '../types/blocks';

export interface BlockPreset {
  id: string;
  label: string;
  /** Short visual hint shown in the palette */
  preview: string;
  create: () => Block;
}

const uid = () => crypto.randomUUID();

const BUCKET = 'https://fsn1.your-objectstorage.com/contentor-email-builder-prod';
const photo = (name: string) => `${BUCKET}/demo-files/photos/${name}`;

const PRESETS: Partial<Record<BlockType, BlockPreset[]>> = {
  heading: [
    {
      id: 'heading-section',
      label: 'Section Title',
      preview: 'Aa',
      create: () => ({
        id: uid(), type: 'heading',
        data: { text: 'Section Title', level: 2 },
        style: {
          padding: { top: 16, right: 24, bottom: 8, left: 24 },
          alignment: 'left', color: '#0f172a', fontSize: 24,
          fontFamily: "'Noto Serif', Georgia, serif", fontWeight: 700,
          letterSpacing: 0, textTransform: 'none',
        },
      }),
    },
    {
      id: 'heading-label',
      label: 'Uppercase Label',
      preview: 'AB',
      create: () => ({
        id: uid(), type: 'heading',
        data: { text: 'CATEGORY LABEL', level: 3 },
        style: {
          padding: { top: 20, right: 24, bottom: 8, left: 24 },
          alignment: 'center', color: '#64748b', fontSize: 11,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700,
          letterSpacing: 3, textTransform: 'uppercase',
        },
      }),
    },
    {
      id: 'heading-hero',
      label: 'Large Display',
      preview: 'H1',
      create: () => ({
        id: uid(), type: 'heading',
        data: { text: 'Make a statement', level: 1 },
        style: {
          padding: { top: 24, right: 32, bottom: 12, left: 32 },
          alignment: 'center', color: '#1e293b', fontSize: 36,
          fontFamily: "'Noto Serif', Georgia, serif", fontWeight: 700,
          letterSpacing: -0.5, textTransform: 'none',
        },
      }),
    },
    {
      id: 'heading-subtle',
      label: 'Subtle Serif',
      preview: 'Ss',
      create: () => ({
        id: uid(), type: 'heading',
        data: { text: 'A gentle note', level: 3 },
        style: {
          padding: { top: 16, right: 24, bottom: 8, left: 24 },
          alignment: 'left', color: '#78716c', fontSize: 18,
          fontFamily: "'Noto Serif', Georgia, serif", fontWeight: 400,
          letterSpacing: 0, textTransform: 'none',
        },
      }),
    },
  ],

  text: [
    {
      id: 'text-body',
      label: 'Body Text',
      preview: 'Paragraph with standard styling',
      create: () => ({
        id: uid(), type: 'text',
        data: { html: '<p style="margin:0;line-height:1.6;">Write your message here. Keep it concise and action-oriented for the best reader engagement.</p>', variables: [] },
        style: { padding: { top: 8, right: 24, bottom: 8, left: 24 } },
      }),
    },
    {
      id: 'text-quote',
      label: 'Pull Quote',
      preview: 'Centered italic quote block',
      create: () => ({
        id: uid(), type: 'text',
        data: {
          html: '<p style="margin:0;text-align:center;font-family:\'Noto Serif\',Georgia,serif;font-size:20px;font-style:italic;color:#334155;line-height:1.6;">"Design is not just what it looks like. Design is how it works."</p><p style="margin:12px 0 0;text-align:center;font-size:13px;color:#94a3b8;">— Steve Jobs</p>',
          variables: [],
        },
        style: { padding: { top: 24, right: 40, bottom: 24, left: 40 }, alignment: 'center', backgroundColor: '#f8fafc' },
      }),
    },
    {
      id: 'text-caption',
      label: 'Small Caption',
      preview: 'Muted fine print',
      create: () => ({
        id: uid(), type: 'text',
        data: { html: '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">You are receiving this email because you signed up for updates.</p>', variables: [] },
        style: { padding: { top: 4, right: 24, bottom: 4, left: 24 }, alignment: 'center' },
      }),
    },
    {
      id: 'text-highlight',
      label: 'Highlight Box',
      preview: 'Colored background callout',
      create: () => ({
        id: uid(), type: 'text',
        data: { html: '<p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">💡 <strong>Pro tip:</strong> You can customize every detail of this email to match your brand.</p>', variables: [] },
        style: { padding: { top: 16, right: 24, bottom: 16, left: 24 }, backgroundColor: '#eff6ff' },
      }),
    },
  ],

  button: [
    {
      id: 'button-solid',
      label: 'Solid Pill',
      preview: 'Rounded primary button',
      create: () => ({
        id: uid(), type: 'button',
        data: { text: 'Get Started', url: 'https://' },
        style: {
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          alignment: 'center', backgroundColor: '#2563eb', color: '#ffffff',
          borderRadius: 50, fullWidth: false, fontSize: 15,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          borderStyle: 'solid', borderColor: '#2563eb', borderWidth: 0,
          letterSpacing: 0, textTransform: 'none', paddingX: 32, paddingY: 14,
        },
      }),
    },
    {
      id: 'button-outline',
      label: 'Outline',
      preview: 'Border-only button',
      create: () => ({
        id: uid(), type: 'button',
        data: { text: 'Learn More', url: 'https://' },
        style: {
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          alignment: 'center', backgroundColor: '#ffffff', color: '#2563eb',
          borderRadius: 8, fullWidth: false, fontSize: 14,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          borderStyle: 'solid', borderColor: '#2563eb', borderWidth: 2,
          letterSpacing: 0, textTransform: 'none', paddingX: 28, paddingY: 12,
        },
      }),
    },
    {
      id: 'button-dark',
      label: 'Dark Rounded',
      preview: 'Dark background button',
      create: () => ({
        id: uid(), type: 'button',
        data: { text: 'Shop Now', url: 'https://' },
        style: {
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          alignment: 'center', backgroundColor: '#0f172a', color: '#ffffff',
          borderRadius: 8, fullWidth: false, fontSize: 15,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          borderStyle: 'solid', borderColor: '#0f172a', borderWidth: 0,
          letterSpacing: 0, textTransform: 'none', paddingX: 32, paddingY: 14,
        },
      }),
    },
    {
      id: 'button-fullwidth',
      label: 'Full Width',
      preview: 'Edge-to-edge button',
      create: () => ({
        id: uid(), type: 'button',
        data: { text: 'Complete Your Profile', url: 'https://' },
        style: {
          padding: { top: 8, right: 24, bottom: 8, left: 24 },
          alignment: 'center', backgroundColor: '#2563eb', color: '#ffffff',
          borderRadius: 8, fullWidth: true, fontSize: 15,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 600,
          borderStyle: 'solid', borderColor: '#2563eb', borderWidth: 0,
          letterSpacing: 0, textTransform: 'none', paddingX: 24, paddingY: 14,
        },
      }),
    },
    {
      id: 'button-caps',
      label: 'Uppercase Pill',
      preview: 'ALL CAPS with tracking',
      create: () => ({
        id: uid(), type: 'button',
        data: { text: 'VIEW DETAILS', url: 'https://' },
        style: {
          padding: { top: 12, right: 24, bottom: 12, left: 24 },
          alignment: 'center', backgroundColor: '#406660', color: '#e2fff9',
          borderRadius: 50, fullWidth: false, fontSize: 11,
          fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 700,
          borderStyle: 'solid', borderColor: '#406660', borderWidth: 0,
          letterSpacing: 1.5, textTransform: 'uppercase', paddingX: 24, paddingY: 10,
        },
      }),
    },
  ],

  divider: [
    {
      id: 'divider-thin',
      label: 'Thin Line',
      preview: '────────',
      create: () => ({
        id: uid(), type: 'divider', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineStyle: 'solid', lineColor: '#e2e8f0', lineThickness: 1, spacing: 20 },
      }),
    },
    {
      id: 'divider-bold',
      label: 'Bold Line',
      preview: '━━━━━━━━',
      create: () => ({
        id: uid(), type: 'divider', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineStyle: 'solid', lineColor: '#cbd5e1', lineThickness: 3, spacing: 24 },
      }),
    },
    {
      id: 'divider-dashed',
      label: 'Dashed',
      preview: '- - - - - -',
      create: () => ({
        id: uid(), type: 'divider', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineStyle: 'dashed', lineColor: '#cbd5e1', lineThickness: 1, spacing: 20 },
      }),
    },
    {
      id: 'divider-dotted',
      label: 'Dotted',
      preview: '· · · · · · ·',
      create: () => ({
        id: uid(), type: 'divider', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, lineStyle: 'dotted', lineColor: '#94a3b8', lineThickness: 2, spacing: 20 },
      }),
    },
    {
      id: 'divider-short',
      label: 'Short Center',
      preview: '   ───   ',
      create: () => ({
        id: uid(), type: 'divider', data: {},
        style: { padding: { top: 0, right: 180, bottom: 0, left: 180 }, lineStyle: 'solid', lineColor: '#cbd5e1', lineThickness: 2, spacing: 16 },
      }),
    },
  ],

  spacer: [
    {
      id: 'spacer-sm',
      label: 'Small',
      preview: '↕ 16px',
      create: () => ({
        id: uid(), type: 'spacer', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, height: 16, backgroundColor: null },
      }),
    },
    {
      id: 'spacer-md',
      label: 'Medium',
      preview: '↕ 32px',
      create: () => ({
        id: uid(), type: 'spacer', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, height: 32, backgroundColor: null },
      }),
    },
    {
      id: 'spacer-lg',
      label: 'Large',
      preview: '↕ 48px',
      create: () => ({
        id: uid(), type: 'spacer', data: {},
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, height: 48, backgroundColor: null },
      }),
    },
  ],

  image: [
    {
      id: 'image-full',
      label: 'Full Width',
      preview: 'Edge-to-edge image',
      create: () => ({
        id: uid(), type: 'image',
        data: { src: photo('fitness_5.jpg'), alt: 'Image', width: 600 },
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignment: 'center', borderRadius: 0, fullWidth: true },
      }),
    },
    {
      id: 'image-rounded',
      label: 'Rounded',
      preview: 'Rounded corners',
      create: () => ({
        id: uid(), type: 'image',
        data: { src: photo('yoga_5.jpg'), alt: 'Image', width: 600 },
        style: { padding: { top: 12, right: 24, bottom: 12, left: 24 }, alignment: 'center', borderRadius: 12, fullWidth: false },
      }),
    },
    {
      id: 'image-circle',
      label: 'Circle / Avatar',
      preview: 'Circular crop',
      create: () => ({
        id: uid(), type: 'image',
        data: { src: photo('face_yoga_1.png'), alt: 'Avatar', width: 120, height: 120 },
        style: { padding: { top: 12, right: 24, bottom: 12, left: 24 }, alignment: 'center', borderRadius: 999, fullWidth: false },
      }),
    },
  ],

  columns: [
    {
      id: 'columns-2-equal',
      label: '2 Equal',
      preview: '▌ ▐',
      create: () => ({
        id: uid(), type: 'columns',
        data: {
          columnCount: 2 as const, columnRatio: [50, 50],
          columns: [{ id: uid(), blocks: [] }, { id: uid(), blocks: [] }],
        },
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 12, stackOnMobile: true },
      }),
    },
    {
      id: 'columns-2-wide-left',
      label: '2/3 + 1/3',
      preview: '▌▌ ▐',
      create: () => ({
        id: uid(), type: 'columns',
        data: {
          columnCount: 2 as const, columnRatio: [66, 34],
          columns: [{ id: uid(), blocks: [] }, { id: uid(), blocks: [] }],
        },
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 12, stackOnMobile: true },
      }),
    },
    {
      id: 'columns-3-equal',
      label: '3 Equal',
      preview: '▌ | ▐',
      create: () => ({
        id: uid(), type: 'columns',
        data: {
          columnCount: 3 as const, columnRatio: [33, 34, 33],
          columns: [{ id: uid(), blocks: [] }, { id: uid(), blocks: [] }, { id: uid(), blocks: [] }],
        },
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 10, stackOnMobile: true },
      }),
    },
  ],

  hero: [
    {
      id: 'hero-dark-bottom',
      label: 'Dark Overlay',
      preview: 'White text, dark gradient',
      create: () => ({
        id: uid(), type: 'hero',
        data: {
          backgroundImage: photo('yoga_14.jpg'), heading: 'Your headline here',
          subheading: 'Supporting message for your audience.', buttonText: 'Get Started', buttonUrl: 'https://',
        },
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 }, height: 440,
          overlayColor: '#0f172a', overlayOpacity: 0.5, headingColor: '#ffffff',
          headingFontSize: 34, headingFontFamily: "'Noto Serif', Georgia, serif",
          subheadingColor: '#ffffffcc', buttonBackgroundColor: '#ffffff', buttonTextColor: '#0f172a',
          buttonBorderRadius: 50, contentAlignment: 'center', verticalAlignment: 'bottom',
        },
      }),
    },
    {
      id: 'hero-light',
      label: 'Light Overlay',
      preview: 'Dark text, light wash',
      create: () => ({
        id: uid(), type: 'hero',
        data: {
          backgroundImage: photo('pilates_4.jpg'), heading: 'Your headline here',
          subheading: 'Supporting message for your audience.', buttonText: 'Explore', buttonUrl: 'https://',
        },
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 }, height: 400,
          overlayColor: '#f8fafc', overlayOpacity: 0.75, headingColor: '#1e293b',
          headingFontSize: 32, headingFontFamily: "'Noto Serif', Georgia, serif",
          subheadingColor: '#475569', buttonBackgroundColor: '#0f172a', buttonTextColor: '#ffffff',
          buttonBorderRadius: 8, contentAlignment: 'left', verticalAlignment: 'bottom',
        },
      }),
    },
  ],

  social: [
    {
      id: 'social-standard',
      label: 'Standard',
      preview: 'Centered row of icons',
      create: () => ({
        id: uid(), type: 'social',
        data: {
          platforms: [
            { type: 'facebook', url: 'https://facebook.com/' },
            { type: 'twitter', url: 'https://x.com/' },
            { type: 'instagram', url: 'https://instagram.com/' },
          ],
        },
        style: {
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          alignment: 'center', iconSize: 28, iconStyle: 'colored', layout: 'horizontal', spacing: 12,
        },
      }),
    },
    {
      id: 'social-all',
      label: 'All Platforms',
      preview: 'Full social set',
      create: () => ({
        id: uid(), type: 'social',
        data: {
          platforms: [
            { type: 'facebook', url: 'https://facebook.com/' },
            { type: 'twitter', url: 'https://x.com/' },
            { type: 'instagram', url: 'https://instagram.com/' },
            { type: 'linkedin', url: 'https://linkedin.com/' },
            { type: 'youtube', url: 'https://youtube.com/' },
            { type: 'tiktok', url: 'https://tiktok.com/' },
          ],
        },
        style: {
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          alignment: 'center', iconSize: 24, iconStyle: 'colored', layout: 'horizontal', spacing: 10,
        },
      }),
    },
  ],
};

const CUSTOM_PRESETS_KEY = 'mailcraft_custom_presets';

interface StoredPreset {
  id: string;
  label: string;
  type: BlockType;
  blockData: Omit<Block, 'id'>;
}

function loadStoredPresets(): StoredPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredPreset[];
  } catch {
    return [];
  }
}

function persistPresets(presets: StoredPreset[]) {
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

export function saveCustomPreset(block: Block, label: string) {
  const stored = loadStoredPresets();
  const { id: _id, ...blockWithoutId } = block;
  stored.push({
    id: `custom-${uid()}`,
    label,
    type: block.type,
    blockData: blockWithoutId,
  });
  persistPresets(stored);
  window.dispatchEvent(new Event('mailcraft-presets-changed'));
}

export function deleteCustomPreset(presetId: string) {
  const stored = loadStoredPresets().filter((p) => p.id !== presetId);
  persistPresets(stored);
  window.dispatchEvent(new Event('mailcraft-presets-changed'));
}

export function getCustomPresetsForType(type: BlockType): BlockPreset[] {
  return loadStoredPresets()
    .filter((p) => p.type === type)
    .map((p) => ({
      id: p.id,
      label: p.label,
      preview: '★',
      create: () => ({ ...structuredClone(p.blockData), id: uid() } as Block),
    }));
}

export function getPresetsForType(type: BlockType): BlockPreset[] {
  return [...(PRESETS[type] || []), ...getCustomPresetsForType(type)];
}
