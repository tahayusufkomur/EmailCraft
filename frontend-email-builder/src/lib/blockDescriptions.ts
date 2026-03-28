import type { BlockType } from '../types/blocks';

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  heading: 'Large title text for section headers',
  text: 'Rich text content with formatting options',
  image: 'Single image with optional link and alt text',
  button: 'Call-to-action button with customizable style',
  spacer: 'Adjustable vertical spacing between blocks',
  divider: 'Horizontal line separator',
  columns: 'Multi-column layout — drag blocks into each column',
  social: 'Social media icon links',
  hero: 'Full-width hero section with background image and overlay',
  html: 'Raw HTML code block for custom content',
  card: 'Styled card with optional icon, badge, heading, text, and button',
  list: 'List with custom icons, text, and optional subtitles per item',
  profile: 'Person card with photo, name, role, and bio',
};
