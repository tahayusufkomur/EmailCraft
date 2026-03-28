import { useCallback, useRef, useState } from 'react';
import type { ProfileBlock as ProfileBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { api } from '../../lib/api';
import { MediaLibraryModal } from '../Media/MediaLibraryModal';

interface Props {
  block: ProfileBlockType;
}

export function ProfileBlock({ block }: Props) {
  const { data, style } = block;
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const name = useInlineEdit({
    getValue: useCallback(() => data.name || '', [data.name]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, name: value } } as Partial<ProfileBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const role = useInlineEdit({
    getValue: useCallback(() => data.role || '', [data.role]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, role: value } } as Partial<ProfileBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const bio = useInlineEdit({
    getValue: useCallback(() => data.bio || '', [data.bio]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, bio: value } } as Partial<ProfileBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const input = e.currentTarget;
    setIsUploading(true);
    try {
      const uploaded = await api.uploadImage(file, { uploadBatchSize: 1 });
      updateBlock(block.id, { data: { ...data, imageSrc: uploaded.file_url } } as Partial<ProfileBlockType>);
    } catch { /* silently fail */ } finally {
      input.value = '';
      setIsUploading(false);
    }
  };

  const editStyle = (active: boolean): React.CSSProperties => ({
    outline: active ? '2px solid #6366f1' : undefined,
    outlineOffset: 2,
    borderRadius: active ? 2 : undefined,
    cursor: active ? 'text' : undefined,
    minHeight: '1em',
  });

  const isTop = style.imagePosition === 'top';
  const isRight = style.imagePosition === 'right';

  const imageEl = (
    <div style={{
      flexShrink: 0,
      width: style.imageSize ?? 72,
      height: style.imageSize ?? 72,
      ...(isTop ? { margin: '0 auto 12px' } : {}),
    }}>
      {data.imageSrc ? (
        <img
          src={data.imageSrc}
          alt={data.imageAlt || ''}
          style={{
            width: style.imageSize ?? 72,
            height: style.imageSize ?? 72,
            borderRadius: `${style.imageBorderRadius ?? 50}%`,
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          onClick={() => setShowMediaLibrary(true)}
          style={{
            width: style.imageSize ?? 72,
            height: style.imageSize ?? 72,
            borderRadius: `${style.imageBorderRadius ?? 50}%`,
            backgroundColor: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 12,
            color: '#94a3b8',
            border: '2px dashed #cbd5e1',
          }}
        >
          {isUploading ? '...' : 'Photo'}
        </div>
      )}
    </div>
  );

  const textEl = (
    <div style={{ textAlign: isTop ? (style.contentAlignment || 'center') : 'left' }}>
      {data.showBadge && (
        <div style={{ marginBottom: 4 }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 10,
            backgroundColor: style.badgeBackgroundColor ?? '#eef2ff',
            color: style.badgeTextColor ?? '#4338ca',
            fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
          }}>
            {data.badgeText || 'Badge'}
          </span>
        </div>
      )}
      <div
        ref={name.ref as React.RefObject<HTMLDivElement>}
        onDoubleClick={name.handleDoubleClick}
        onPointerDown={name.isEditing ? name.suppressDrag : undefined}
        onMouseDown={name.isEditing ? name.suppressDrag : undefined}
        suppressContentEditableWarning
        style={{
          color: style.nameColor ?? '#0f172a',
          fontSize: style.nameFontSize ?? 18,
          fontFamily: style.nameFontFamily || 'Arial, Helvetica, sans-serif',
          fontWeight: style.nameFontWeight ?? 700,
          lineHeight: 1.3,
          ...editStyle(name.isEditing),
        }}
      >
        {data.name || 'Name'}
      </div>
      {(data.role || role.isEditing) && (
        <div
          ref={role.ref as React.RefObject<HTMLDivElement>}
          onDoubleClick={role.handleDoubleClick}
          onPointerDown={role.isEditing ? role.suppressDrag : undefined}
          onMouseDown={role.isEditing ? role.suppressDrag : undefined}
          suppressContentEditableWarning
          style={{
            color: style.roleColor ?? '#6366f1',
            fontSize: style.roleFontSize ?? 13,
            fontFamily: style.bioFontFamily || 'Arial, Helvetica, sans-serif',
            fontWeight: 600,
            lineHeight: 1.3,
            marginTop: 2,
            ...editStyle(role.isEditing),
          }}
        >
          {data.role || 'Role'}
        </div>
      )}
      {(data.bio || bio.isEditing) && (
        <div
          ref={bio.ref as React.RefObject<HTMLDivElement>}
          onDoubleClick={bio.handleDoubleClick}
          onPointerDown={bio.isEditing ? bio.suppressDrag : undefined}
          onMouseDown={bio.isEditing ? bio.suppressDrag : undefined}
          suppressContentEditableWarning
          style={{
            color: style.bioColor ?? '#64748b',
            fontSize: style.bioFontSize ?? 14,
            fontFamily: style.bioFontFamily || 'Arial, Helvetica, sans-serif',
            lineHeight: 1.5,
            marginTop: 6,
            ...editStyle(bio.isEditing),
          }}
        >
          {data.bio || 'Bio'}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={{
        padding: `${style.padding?.top ?? 20}px ${style.padding?.right ?? 20}px ${style.padding?.bottom ?? 20}px ${style.padding?.left ?? 20}px`,
        backgroundColor: style.backgroundColor ?? '#ffffff',
        borderRadius: style.borderRadius ?? 12,
        borderWidth: style.borderWidth ?? 1,
        borderColor: style.borderColor ?? '#e2e8f0',
        borderStyle: style.borderStyle ?? 'solid',
        display: isTop ? 'block' : 'flex',
        flexDirection: isRight ? 'row-reverse' : 'row',
        alignItems: isTop ? undefined : 'center',
        gap: isTop ? 0 : 16,
        textAlign: isTop ? (style.contentAlignment || 'center') : undefined,
      }}>
        {imageEl}
        {textEl}
      </div>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileSelect} />
      {showMediaLibrary && (
        <MediaLibraryModal
          onClose={() => setShowMediaLibrary(false)}
          onSelectUrl={(url) => {
            updateBlock(block.id, { data: { ...data, imageSrc: url } } as Partial<ProfileBlockType>);
            setShowMediaLibrary(false);
          }}
        />
      )}
    </>
  );
}
