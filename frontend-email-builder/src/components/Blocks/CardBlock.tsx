import { useCallback } from 'react';
import type { CardBlock as CardBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { highlightVariables } from '../../lib/variableUtils';

interface Props {
  block: CardBlockType;
}

export function CardBlock({ block }: Props) {
  const { data, style } = block;
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const heading = useInlineEdit({
    getValue: useCallback(() => data.heading || '', [data.heading]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, heading: value } } as Partial<CardBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const body = useInlineEdit({
    getValue: useCallback(() => data.body || '', [data.body]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, body: value } } as Partial<CardBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const badge = useInlineEdit({
    getValue: useCallback(() => data.badgeText || '', [data.badgeText]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, badgeText: value } } as Partial<CardBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const buttonText = useInlineEdit({
    getValue: useCallback(() => data.buttonText || '', [data.buttonText]),
    onCommit: useCallback((value: string) => {
      updateBlock(block.id, { data: { ...data, buttonText: value } } as Partial<CardBlockType>);
    }, [updateBlock, block.id, data]),
  });

  const editStyle = (active: boolean): React.CSSProperties => ({
    outline: active ? '2px solid #6366f1' : undefined,
    outlineOffset: 2,
    borderRadius: active ? 2 : undefined,
    cursor: active ? 'text' : undefined,
    minHeight: '1em',
  });

  return (
    <div
      style={{
        padding: `${style.padding?.top ?? 24}px ${style.padding?.right ?? 24}px ${style.padding?.bottom ?? 24}px ${style.padding?.left ?? 24}px`,
        backgroundColor: style.backgroundColor ?? '#ffffff',
        borderRadius: style.borderRadius ?? 12,
        borderWidth: style.borderWidth ?? 1,
        borderColor: style.borderColor ?? '#e2e8f0',
        borderStyle: style.borderStyle ?? 'solid',
        textAlign: style.contentAlignment || 'center',
      }}
    >
      {/* Icon */}
      {data.showIcon && (
        <div style={{ marginBottom: 12 }}>
          {data.iconMode === 'emoji' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: style.iconSize ?? 48,
                height: style.iconSize ?? 48,
                borderRadius: `${style.iconBorderRadius ?? 50}%`,
                backgroundColor: style.iconBackgroundColor ?? '#eef2ff',
                fontSize: (style.iconSize ?? 48) * 0.55,
                lineHeight: 1,
              }}
            >
              {data.iconEmoji || '✨'}
            </span>
          ) : data.iconImageSrc ? (
            <img
              src={data.iconImageSrc}
              alt={data.iconImageAlt || ''}
              style={{
                width: style.iconSize ?? 48,
                height: style.iconSize ?? 48,
                borderRadius: `${style.iconBorderRadius ?? 50}%`,
                objectFit: 'cover',
                display: 'inline-block',
              }}
            />
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: style.iconSize ?? 48,
                height: style.iconSize ?? 48,
                borderRadius: `${style.iconBorderRadius ?? 50}%`,
                backgroundColor: style.iconBackgroundColor ?? '#eef2ff',
                fontSize: 14,
                color: '#94a3b8',
              }}
            >
              IMG
            </span>
          )}
        </div>
      )}

      {/* Badge */}
      {data.showBadge && (
        <div style={{ marginBottom: 8 }}>
          <span
            ref={badge.ref as React.RefObject<HTMLSpanElement>}
            onDoubleClick={badge.handleDoubleClick}
            onPointerDown={badge.isEditing ? badge.suppressDrag : undefined}
            onMouseDown={badge.isEditing ? badge.suppressDrag : undefined}
            suppressContentEditableWarning
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: 12,
              backgroundColor: style.badgeBackgroundColor ?? '#eef2ff',
              color: style.badgeTextColor ?? '#4338ca',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              ...editStyle(badge.isEditing),
            }}
          >
            {data.badgeText || 'Badge'}
          </span>
        </div>
      )}

      {/* Heading */}
      <h3
        ref={heading.ref as React.RefObject<HTMLHeadingElement>}
        onDoubleClick={heading.handleDoubleClick}
        onPointerDown={heading.isEditing ? heading.suppressDrag : undefined}
        onMouseDown={heading.isEditing ? heading.suppressDrag : undefined}
        suppressContentEditableWarning
        style={{
          margin: '0 0 8px',
          color: style.headingColor ?? '#0f172a',
          fontSize: style.headingFontSize ?? 22,
          fontFamily: style.headingFontFamily || 'Arial, Helvetica, sans-serif',
          fontWeight: style.headingFontWeight ?? 700,
          lineHeight: 1.3,
          ...editStyle(heading.isEditing),
        }}
      >
        {heading.isEditing ? (data.heading || '') : highlightVariables(data.heading || 'Card heading')}
      </h3>

      {/* Body */}
      <p
        ref={body.ref as React.RefObject<HTMLParagraphElement>}
        onDoubleClick={body.handleDoubleClick}
        onPointerDown={body.isEditing ? body.suppressDrag : undefined}
        onMouseDown={body.isEditing ? body.suppressDrag : undefined}
        suppressContentEditableWarning
        style={{
          margin: '0 0 16px',
          color: style.bodyColor ?? '#475569',
          fontSize: style.bodyFontSize ?? 15,
          fontFamily: style.bodyFontFamily || 'Arial, Helvetica, sans-serif',
          lineHeight: 1.5,
          ...editStyle(body.isEditing),
        }}
      >
        {body.isEditing ? (data.body || '') : highlightVariables(data.body || 'Add a description for your card here.')}
      </p>

      {/* Button */}
      {data.showButton && (
        <div>
          <a
            href={data.buttonUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            style={{
              display: style.buttonFullWidth ? 'block' : 'inline-block',
              padding: `${style.buttonPaddingY ?? 10}px ${style.buttonPaddingX ?? 20}px`,
              backgroundColor: style.buttonBackgroundColor ?? '#4f46e5',
              color: style.buttonTextColor ?? '#ffffff',
              borderRadius: style.buttonBorderRadius ?? 6,
              fontSize: style.buttonFontSize ?? 14,
              fontFamily: style.buttonFontFamily || 'Arial, Helvetica, sans-serif',
              fontWeight: style.buttonFontWeight ?? 600,
              textDecoration: 'none',
              textAlign: 'center',
              cursor: buttonText.isEditing ? 'text' : 'pointer',
              borderStyle: style.buttonBorderStyle ?? 'solid',
              borderColor: style.buttonBorderColor ?? style.buttonBackgroundColor ?? '#4f46e5',
              borderWidth: style.buttonBorderWidth ?? 0,
              boxSizing: 'border-box' as const,
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
            >
              {buttonText.isEditing ? (data.buttonText || '') : highlightVariables(data.buttonText || 'Learn More')}
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
