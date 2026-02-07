import type { ImageBlock } from '../types/blocks';

export function applyImageUrlToBlock(
  block: ImageBlock,
  imageUrl: string,
  updateBlock: (id: string, updates: Partial<ImageBlock>) => void,
) {
  const preview = new Image();
  preview.onload = () => {
    const naturalWidth = preview.naturalWidth || preview.width || block.data.width;
    const naturalHeight = preview.naturalHeight || preview.height || block.data.height;
    updateBlock(block.id, {
      data: {
        ...block.data,
        src: imageUrl,
        width: naturalWidth,
        height: naturalHeight,
      },
    } as Partial<ImageBlock>);
  };
  preview.onerror = () => {
    updateBlock(block.id, {
      data: { ...block.data, src: imageUrl },
    } as Partial<ImageBlock>);
  };
  preview.src = imageUrl;
}
