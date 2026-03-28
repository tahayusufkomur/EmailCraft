import type { Block, BlockType } from '../types/blocks';

const DEFAULT_PADDING = { top: 10, right: 20, bottom: 10, left: 20 };

export function createBlock(type: BlockType): Block {
  const id = crypto.randomUUID();

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        data: { html: '<p>Type your text here...</p>', variables: [] },
        style: { padding: DEFAULT_PADDING },
      };

    case 'image':
      return {
        id,
        type: 'image',
        data: { src: '', alt: 'Image', width: 600 },
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignment: 'center', borderRadius: 0, fullWidth: false },
      };

    case 'button':
      return {
        id,
        type: 'button',
        data: { text: 'Click Here', url: 'https://' },
        style: {
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          alignment: 'center',
          backgroundColor: '#007bff',
          color: '#ffffff',
          borderRadius: 4,
          fullWidth: false,
          fontSize: 16,
          fontFamily: 'Arial, Helvetica, sans-serif',
          borderStyle: 'solid',
          borderColor: '#007bff',
          borderWidth: 0,
          fontWeight: 600,
          letterSpacing: 0,
          textTransform: 'none',
          paddingX: 24,
          paddingY: 12,
        },
      };

    case 'divider':
      return {
        id,
        type: 'divider',
        data: {},
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          lineStyle: 'solid',
          lineColor: '#cccccc',
          lineThickness: 1,
          spacing: 20,
        },
      };

    case 'columns':
      return {
        id,
        type: 'columns',
        data: {
          columnCount: 2,
          columnRatio: [50, 50],
          columns: [
            { id: crypto.randomUUID(), blocks: [] },
            { id: crypto.randomUUID(), blocks: [] },
          ],
        },
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          gap: 10,
          stackOnMobile: true,
        },
      };

    case 'social':
      return {
        id,
        type: 'social',
        data: {
          platforms: [
            { type: 'facebook', url: 'https://facebook.com/' },
            { type: 'twitter', url: 'https://x.com/' },
            { type: 'instagram', url: 'https://instagram.com/' },
          ],
        },
        style: {
          padding: DEFAULT_PADDING,
          alignment: 'center',
          iconSize: 32,
          iconStyle: 'colored',
          layout: 'horizontal',
          spacing: 10,
        },
      };

    case 'heading':
      return {
        id,
        type: 'heading',
        data: { text: 'Your heading goes here', level: 2 },
        style: {
          padding: DEFAULT_PADDING,
          alignment: 'left',
          color: '#0f172a',
          fontSize: 28,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 700,
          letterSpacing: 0,
          textTransform: 'none',
        },
      };

    case 'spacer':
      return {
        id,
        type: 'spacer',
        data: {},
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          height: 32,
          backgroundColor: null,
        },
      };

    case 'html':
      return {
        id,
        type: 'html',
        data: {
          html: '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:12px;background:#eef2ff;border-radius:8px;">Custom HTML block</td></tr></table>',
        },
        style: {
          padding: DEFAULT_PADDING,
          alignment: 'left',
          backgroundColor: null,
        },
      };

    case 'hero':
      return {
        id,
        type: 'hero',
        data: {
          backgroundImage: '',
          heading: 'Your headline here',
          subheading: 'Add a supporting message for your audience.',
          buttonText: 'Get Started',
          buttonUrl: 'https://',
        },
        style: {
          padding: { top: 0, right: 0, bottom: 0, left: 0 },
          height: 400,
          overlayColor: '#000000',
          overlayOpacity: 0.4,
          headingColor: '#ffffff',
          headingFontSize: 36,
          headingFontFamily: 'Arial, Helvetica, sans-serif',
          subheadingColor: '#ffffffcc',
          buttonBackgroundColor: '#ffffff',
          buttonTextColor: '#000000',
          buttonBorderRadius: 50,
          contentAlignment: 'center',
          verticalAlignment: 'bottom',
        },
      };

    case 'list':
      return {
        id,
        type: 'list',
        data: {
          items: [
            { id: crypto.randomUUID(), icon: '✓', text: 'First item', subtitle: '' },
            { id: crypto.randomUUID(), icon: '✓', text: 'Second item', subtitle: '' },
            { id: crypto.randomUUID(), icon: '✓', text: 'Third item', subtitle: '' },
          ],
        },
        style: {
          padding: { top: 16, right: 24, bottom: 16, left: 24 },
          backgroundColor: null,
          iconSize: 20,
          iconColor: '#4f46e5',
          textColor: '#0f172a',
          textFontSize: 15,
          textFontFamily: 'Arial, Helvetica, sans-serif',
          textFontWeight: 500,
          subtitleColor: '#64748b',
          subtitleFontSize: 13,
          spacing: 12,
          layout: 'vertical',
          contentAlignment: 'left',
        },
      };

    case 'profile':
      return {
        id,
        type: 'profile',
        data: {
          imageSrc: '',
          imageAlt: 'Profile photo',
          name: 'Jane Smith',
          role: 'Instructor',
          bio: 'A short bio or description goes here.',
          showBadge: false,
          badgeText: 'Featured',
        },
        style: {
          padding: { top: 20, right: 20, bottom: 20, left: 20 },
          backgroundColor: '#ffffff',
          imageSize: 72,
          imageBorderRadius: 50,
          imagePosition: 'left',
          nameColor: '#0f172a',
          nameFontSize: 18,
          nameFontFamily: 'Arial, Helvetica, sans-serif',
          nameFontWeight: 700,
          roleColor: '#6366f1',
          roleFontSize: 13,
          bioColor: '#64748b',
          bioFontSize: 14,
          bioFontFamily: 'Arial, Helvetica, sans-serif',
          badgeBackgroundColor: '#eef2ff',
          badgeTextColor: '#4338ca',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderStyle: 'solid',
          contentAlignment: 'left',
        },
      };

    case 'card':
      return {
        id,
        type: 'card',
        data: {
          showIcon: false,
          iconMode: 'emoji',
          iconEmoji: '✨',
          iconImageSrc: '',
          iconImageAlt: '',
          showBadge: false,
          badgeText: 'New',
          heading: 'Card heading',
          body: 'Add a description for your card here.',
          showButton: true,
          buttonText: 'Learn More',
          buttonUrl: 'https://',
        },
        style: {
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
          backgroundColor: '#ffffff',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderStyle: 'solid',
          iconSize: 48,
          iconBackgroundColor: '#eef2ff',
          iconBorderRadius: 50,
          badgeBackgroundColor: '#eef2ff',
          badgeTextColor: '#4338ca',
          headingColor: '#0f172a',
          headingFontSize: 22,
          headingFontFamily: 'Arial, Helvetica, sans-serif',
          headingFontWeight: 700,
          bodyColor: '#475569',
          bodyFontSize: 15,
          bodyFontFamily: 'Arial, Helvetica, sans-serif',
          buttonBackgroundColor: '#4f46e5',
          buttonTextColor: '#ffffff',
          buttonBorderRadius: 6,
          buttonFontSize: 14,
          buttonFontFamily: 'Arial, Helvetica, sans-serif',
          buttonFontWeight: 600,
          buttonPaddingX: 20,
          buttonPaddingY: 10,
          buttonFullWidth: false,
          buttonBorderStyle: 'solid',
          buttonBorderColor: '#4f46e5',
          buttonBorderWidth: 0,
          contentAlignment: 'center',
        },
      };
  }
}
