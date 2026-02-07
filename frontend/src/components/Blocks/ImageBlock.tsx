import type { ImageBlock as ImageBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { useRef } from 'react';

interface Props {
  block: ImageBlockType;
}

export function ImageBlock({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, use a local object URL for preview
    // In production, this would upload to S3 via presigned URL
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      updateBlock(block.id, {
        data: { ...block.data, src: url, width: img.width, height: img.height },
      } as Partial<ImageBlockType>);
    };
    img.src = url;
  };

  if (!block.data.src) {
    return (
      <div className="image-block-placeholder" onClick={() => fileInputRef.current?.click()}>
        <span style={{ fontSize: 24 }}>&#x1F5BC;</span>
        <span>Click to upload an image</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  return (
    <div className="image-block-content" style={{ textAlign: block.style.alignment || 'center' }}>
      <img
        src={block.data.src}
        alt={block.data.alt}
        style={{ maxWidth: block.data.width, width: '100%' }}
      />
    </div>
  );
}
