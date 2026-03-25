import type { ImageBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { SliderInput } from './SliderInput';

interface Props {
  block: ImageBlock;
}

export function ImageSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const update = (data: Partial<ImageBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<ImageBlock>);
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Image</div>
        <div className="form-group">
          <label>Image URL</label>
          <input type="url" value={block.data.src} onChange={(e) => update({ src: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Alt Text</label>
          <input type="text" value={block.data.alt} onChange={(e) => update({ alt: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input type="url" value={block.data.link || ''} onChange={(e) => update({ link: e.target.value })} />
        </div>
        <SliderInput label="Width" value={block.data.width} min={50} max={600} onChange={(v) => update({ width: v })} />
        <SliderInput label="Border Radius" value={block.style.borderRadius || 0} min={0} max={300} onChange={(v) => updateBlock(block.id, { style: { ...block.style, borderRadius: v } })} />
        <div className="toggle-row">
          <label>Full Width (edge-to-edge)</label>
          <input type="checkbox" checked={block.style.fullWidth || false} onChange={(e) => updateBlock(block.id, { style: { ...block.style, fullWidth: e.target.checked } })} />
        </div>
      </div>
      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'center'}
          onChange={(alignment) => updateBlock(block.id, { style: { ...block.style, alignment } })}
        />
      </div>
      <div className="panel-section">
        <div className="panel-section-title">Padding</div>
        <SpacingControl
          value={block.style.padding || { top: 0, right: 0, bottom: 0, left: 0 }}
          onChange={(padding) => updateBlock(block.id, { style: { ...block.style, padding } })}
        />
      </div>
    </div>
  );
}
