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
        style: { padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignment: 'center' },
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
  }
}
