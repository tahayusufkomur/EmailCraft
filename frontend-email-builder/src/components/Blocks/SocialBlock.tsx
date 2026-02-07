import type { SocialBlock as SocialBlockType } from '../../types/blocks';

interface Props {
  block: SocialBlockType;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877f2',
  twitter: '#000000',
  instagram: '#e4405f',
  linkedin: '#0077b5',
  youtube: '#ff0000',
  tiktok: '#000000',
};

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Fb',
  twitter: 'X',
  instagram: 'Ig',
  linkedin: 'Li',
  youtube: 'Yt',
  tiktok: 'Tk',
};

export function SocialBlock({ block }: Props) {
  const { platforms } = block.data;
  const style = block.style;
  const justifyContent =
    style.alignment === 'left'
      ? 'flex-start'
      : style.alignment === 'right'
        ? 'flex-end'
        : 'center';

  return (
    <div
      className="social-block-content"
      style={{
        justifyContent,
        gap: (style.spacing || 10) + 'px',
        flexDirection: style.layout === 'vertical' ? 'column' : 'row',
      }}
    >
      {platforms.map((p, i) => (
        <div
          key={i}
          className="social-icon-placeholder"
          style={{
            width: (style.iconSize || 32) + 'px',
            height: (style.iconSize || 32) + 'px',
            background: style.iconStyle === 'monochrome' ? '#718096' : PLATFORM_COLORS[p.type] || '#718096',
            fontSize: Math.max(10, (style.iconSize || 32) / 3) + 'px',
          }}
          title={p.url}
        >
          {PLATFORM_LABELS[p.type] || '?'}
        </div>
      ))}
    </div>
  );
}
