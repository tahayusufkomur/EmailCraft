import { useCallback } from 'react';
import type { ButtonBlock as ButtonBlockType } from '../../types/blocks';
import { highlightVariables } from '../../lib/variableUtils';
import { useEditorStore } from '../../store/editorStore';
import { useInlineEdit } from '../../hooks/useInlineEdit';

interface Props {
  block: ButtonBlockType;
}

export function ButtonBlock({ block }: Props) {
  const { text } = block.data;
  const style = block.style;
  const paddingX = style.paddingX ?? 24;
  const paddingY = style.paddingY ?? 12;
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const { ref, isEditing, handleDoubleClick, suppressDrag } = useInlineEdit({
    getValue: useCallback(() => text || '', [text]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...block.data, text: value } } as Partial<ButtonBlockType>);
    }, [updateBlock, block.id, block.data]),
  });

  return (
    <div
      className="button-block-content"
      style={{ textAlign: style.alignment || 'center' }}
    >
      <a
        href={block.data.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="button-block-preview"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          backgroundColor: style.backgroundColor || '#007bff',
          color: style.color || '#ffffff',
          borderRadius: (style.borderRadius || 4) + 'px',
          fontSize: (style.fontSize || 16) + 'px',
          fontFamily: style.fontFamily || 'Arial, Helvetica, sans-serif',
          fontWeight: style.fontWeight || 600,
          letterSpacing: `${style.letterSpacing || 0}px`,
          textTransform: style.textTransform || 'none',
          borderStyle: style.borderStyle || 'solid',
          borderColor: style.borderColor || style.backgroundColor || '#007bff',
          borderWidth: `${style.borderWidth || 0}px`,
          padding: `${paddingY}px ${paddingX}px`,
          width: style.fullWidth ? '100%' : undefined,
          display: style.fullWidth ? 'block' : 'inline-block',
          textAlign: 'center',
          textDecoration: 'none',
          cursor: isEditing ? 'text' : 'pointer',
          boxSizing: 'border-box',
          outline: isEditing ? '2px solid #6366f1' : undefined,
          outlineOffset: 2,
        }}
      >
        <span
          ref={ref as React.RefObject<HTMLSpanElement>}
          onDoubleClick={handleDoubleClick}
          onPointerDown={isEditing ? suppressDrag : undefined}
          onMouseDown={isEditing ? suppressDrag : undefined}
          suppressContentEditableWarning
        >
          {isEditing ? (text || '') : highlightVariables(text || 'Click Here')}
        </span>
      </a>
    </div>
  );
}
