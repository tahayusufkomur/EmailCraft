import type { SocialBlock, SocialPlatform } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { Button } from '../../ui/button';
import { AlignmentPicker } from './AlignmentPicker';
import { SliderInput } from './SliderInput';

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
            <Button size="sm" variant="outline" onClick={() => removePlatform(i)}>
              &times;
            </Button>
          </div>
        ))}
        {block.data.platforms.length < AVAILABLE_PLATFORMS.length && (
          <Button variant="secondary" onClick={addPlatform}>
            + Add Platform
          </Button>
        )}
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Style</div>
        <SliderInput label="Icon Size" value={block.style.iconSize || 32} min={16} max={64} onChange={(v) => updateStyle({ iconSize: v })} />
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
        <SliderInput label="Spacing" value={block.style.spacing || 10} min={0} max={40} onChange={(v) => updateStyle({ spacing: v })} />
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
