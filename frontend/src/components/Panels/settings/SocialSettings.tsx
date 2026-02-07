import type { SocialBlock, SocialPlatform } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';

interface Props {
  block: SocialBlock;
}

const AVAILABLE_PLATFORMS: SocialPlatform['type'][] = [
  'facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok',
];

export function SocialSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updatePlatform = (index: number, updates: Partial<SocialPlatform>) => {
    const platforms = [...block.data.platforms];
    platforms[index] = { ...platforms[index], ...updates };
    updateBlock(block.id, { data: { ...block.data, platforms } } as Partial<SocialBlock>);
  };

  const addPlatform = () => {
    const used = new Set(block.data.platforms.map((p) => p.type));
    const next = AVAILABLE_PLATFORMS.find((p) => !used.has(p));
    if (!next) return;
    const platforms = [...block.data.platforms, { type: next, url: '' }];
    updateBlock(block.id, { data: { ...block.data, platforms } } as Partial<SocialBlock>);
  };

  const removePlatform = (index: number) => {
    const platforms = block.data.platforms.filter((_, i) => i !== index);
    updateBlock(block.id, { data: { ...block.data, platforms } } as Partial<SocialBlock>);
  };

  const updateStyle = (style: Partial<SocialBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Platforms</div>
        {block.data.platforms.map((p, i) => (
          <div key={i} className="form-group" style={{ display: 'flex', gap: 4, alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label>{p.type}</label>
              <input type="url" value={p.url} placeholder="URL" onChange={(e) => updatePlatform(i, { url: e.target.value })} />
            </div>
            <button className="btn" style={{ padding: '6px 8px', marginBottom: 0 }} onClick={() => removePlatform(i)}>&times;</button>
          </div>
        ))}
        {block.data.platforms.length < AVAILABLE_PLATFORMS.length && (
          <button className="btn" style={{ width: '100%', marginTop: 4 }} onClick={addPlatform}>+ Add Platform</button>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Style</div>
        <div className="form-group">
          <label>Icon Size (px)</label>
          <input type="number" min={16} max={64} value={block.style.iconSize || 32} onChange={(e) => updateStyle({ iconSize: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Icon Style</label>
          <select value={block.style.iconStyle || 'colored'} onChange={(e) => updateStyle({ iconStyle: e.target.value as 'colored' | 'monochrome' })}>
            <option value="colored">Colored</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>
        <div className="form-group">
          <label>Layout</label>
          <select value={block.style.layout || 'horizontal'} onChange={(e) => updateStyle({ layout: e.target.value as 'horizontal' | 'vertical' })}>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
        <div className="form-group">
          <label>Spacing (px)</label>
          <input type="number" min={0} max={40} value={block.style.spacing || 10} onChange={(e) => updateStyle({ spacing: Number(e.target.value) })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'center'}
          onChange={(alignment) => updateStyle({ alignment })}
        />
      </div>
    </div>
  );
}
