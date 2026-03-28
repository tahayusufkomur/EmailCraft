import type { ListBlock as ListBlockType } from '../../types/blocks';
import { lucideSvgString } from '../../lib/lucideIcons';

interface Props {
  block: ListBlockType;
}

export function ListBlock({ block }: Props) {
  const { data, style } = block;

  const isHorizontal = style.layout === 'horizontal';

  return (
    <div
      style={{
        padding: `${style.padding?.top ?? 16}px ${style.padding?.right ?? 24}px ${style.padding?.bottom ?? 16}px ${style.padding?.left ?? 24}px`,
        backgroundColor: style.backgroundColor ?? 'transparent',
        textAlign: style.contentAlignment || 'left',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          gap: style.spacing ?? 12,
          flexWrap: isHorizontal ? 'wrap' : undefined,
          justifyContent: isHorizontal
            ? style.contentAlignment === 'center' ? 'center'
              : style.contentAlignment === 'right' ? 'flex-end'
              : 'flex-start'
            : undefined,
        }}
      >
        {data.items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: item.subtitle ? 'flex-start' : 'center',
              gap: 10,
              textAlign: 'left',
            }}
          >
            {item.iconMode === 'lucide' && item.iconName ? (
              <span
                style={{
                  lineHeight: 1,
                  flexShrink: 0,
                  width: (style.iconSize ?? 20) + 4,
                  textAlign: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: lucideSvgString(
                    item.iconName,
                    style.iconSize ?? 20,
                    style.iconColor ?? '#4f46e5',
                  ),
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: style.iconSize ?? 20,
                  color: style.iconColor ?? '#4f46e5',
                  lineHeight: 1,
                  flexShrink: 0,
                  width: (style.iconSize ?? 20) + 4,
                  textAlign: 'center',
                }}
              >
                {item.icon || '•'}
              </span>
            )}
            <div>
              <span
                style={{
                  color: style.textColor ?? '#0f172a',
                  fontSize: style.textFontSize ?? 15,
                  fontFamily: style.textFontFamily || 'Arial, Helvetica, sans-serif',
                  fontWeight: style.textFontWeight ?? 500,
                  lineHeight: 1.4,
                }}
              >
                {item.text || 'List item'}
              </span>
              {item.subtitle && (
                <div
                  style={{
                    color: style.subtitleColor ?? '#64748b',
                    fontSize: style.subtitleFontSize ?? 13,
                    fontFamily: style.textFontFamily || 'Arial, Helvetica, sans-serif',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
