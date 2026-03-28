import type { HeroBlock as HeroBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { useCallback, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { MediaLibraryModal } from '../Media/MediaLibraryModal';
import { useInlineEdit } from '../../hooks/useInlineEdit';

interface Props {
  block: HeroBlockType;
}

export function HeroBlock({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const heading = useInlineEdit({
    getValue: useCallback(() => block.data.heading || '', [block.data.heading]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...block.data, heading: value } } as Partial<HeroBlockType>);
    }, [updateBlock, block.id, block.data]),
  });

  const subheading = useInlineEdit({
    getValue: useCallback(() => block.data.subheading || '', [block.data.subheading]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...block.data, subheading: value } } as Partial<HeroBlockType>);
    }, [updateBlock, block.id, block.data]),
  });

  const buttonText = useInlineEdit({
    getValue: useCallback(() => block.data.buttonText || '', [block.data.buttonText]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...block.data, buttonText: value } } as Partial<HeroBlockType>);
    }, [updateBlock, block.id, block.data]),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const input = e.currentTarget;
    setIsUploading(true);
    try {
      const uploaded = await api.uploadImage(file, { uploadBatchSize: 1 });
      updateBlock(block.id, { data: { ...block.data, backgroundImage: uploaded.file_url } } as Partial<HeroBlockType>);
    } catch {
      // silently fail
    } finally {
      input.value = '';
      setIsUploading(false);
    }
  };

  const overlayRgba = (() => {
    const h = (block.style.overlayColor || '#000000').replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${block.style.overlayOpacity ?? 0.4})`;
  })();

  if (!block.data.backgroundImage) {
    return (
      <>
        <div style={{
          height: block.style.height || 400, background: '#1e293b', borderRadius: 8,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8',
        }}>
          <span style={{ fontSize: 32 }}>&#x1F3DE;</span>
          <span style={{ fontSize: 14 }}>{isUploading ? 'Uploading...' : 'Add a hero background image'}</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn" type="button" onClick={() => setShowMediaLibrary(true)} disabled={isUploading}>
              Select existing
            </button>
            <button className="btn btn-primary" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              Upload
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileSelect} />
        </div>
        {showMediaLibrary && (
          <MediaLibraryModal
            onClose={() => setShowMediaLibrary(false)}
            onSelectUrl={(url) => {
              updateBlock(block.id, { data: { ...block.data, backgroundImage: url } } as Partial<HeroBlockType>);
            }}
          />
        )}
      </>
    );
  }

  const vAlign = block.style.verticalAlignment || 'bottom';
  const flexAlign = vAlign === 'top' ? 'flex-start' : vAlign === 'center' ? 'center' : 'flex-end';
  const gradientDir = vAlign === 'top' ? 'to bottom' : vAlign === 'center' ? 'to bottom' : 'to top';

  const inlineEditStyle = (active: boolean): React.CSSProperties => ({
    outline: active ? '2px solid #6366f1' : undefined,
    outlineOffset: 2,
    borderRadius: active ? 2 : undefined,
    cursor: active ? 'text' : undefined,
    minHeight: '1em',
  });

  return (
    <div style={{
      position: 'relative', height: block.style.height || 400, overflow: 'hidden', borderRadius: 4,
      backgroundImage: `url(${block.data.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
      display: 'flex', alignItems: flexAlign,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(${gradientDir}, ${overlayRgba} 60%, transparent 100%)`,
      }} />
      <div style={{
        position: 'relative', zIndex: 1, padding: 32, width: '100%',
        textAlign: block.style.contentAlignment || 'center',
      }}>
        <h2
          ref={heading.ref as React.RefObject<HTMLHeadingElement>}
          onDoubleClick={heading.handleDoubleClick}
          onPointerDown={heading.isEditing ? heading.suppressDrag : undefined}
          onMouseDown={heading.isEditing ? heading.suppressDrag : undefined}
          suppressContentEditableWarning
          style={{
            margin: '0 0 8px', color: block.style.headingColor || '#ffffff',
            fontSize: block.style.headingFontSize || 36, fontFamily: block.style.headingFontFamily,
            fontWeight: 700, lineHeight: 1.15,
            ...inlineEditStyle(heading.isEditing),
          }}
        >
          {block.data.heading || 'Your headline here'}
        </h2>

        <p
          ref={subheading.ref as React.RefObject<HTMLParagraphElement>}
          onDoubleClick={subheading.handleDoubleClick}
          onPointerDown={subheading.isEditing ? subheading.suppressDrag : undefined}
          onMouseDown={subheading.isEditing ? subheading.suppressDrag : undefined}
          suppressContentEditableWarning
          style={{
            margin: '0 0 20px', color: block.style.subheadingColor || '#ffffffcc', fontSize: 15, lineHeight: 1.5,
            opacity: block.data.subheading ? 1 : 0.5,
            ...inlineEditStyle(subheading.isEditing),
          }}
        >
          {block.data.subheading || 'Add subheading...'}
        </p>

        <a
          href={block.data.buttonUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{
            display: 'inline-block', padding: '14px 32px', cursor: buttonText.isEditing ? 'text' : 'pointer',
            backgroundColor: block.style.buttonBackgroundColor || '#ffffff',
            color: block.style.buttonTextColor || '#000000',
            borderRadius: block.style.buttonBorderRadius || 50,
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
            outline: buttonText.isEditing ? '2px solid #6366f1' : undefined,
            outlineOffset: 2,
          }}
        >
          <span
            ref={buttonText.ref as React.RefObject<HTMLSpanElement>}
            onDoubleClick={buttonText.handleDoubleClick}
            onPointerDown={buttonText.isEditing ? buttonText.suppressDrag : undefined}
            onMouseDown={buttonText.isEditing ? buttonText.suppressDrag : undefined}
            suppressContentEditableWarning
            style={{ opacity: block.data.buttonText ? 1 : 0.5 }}
          >
            {block.data.buttonText || 'Add button...'}
          </span>
        </a>
      </div>
    </div>
  );
}
