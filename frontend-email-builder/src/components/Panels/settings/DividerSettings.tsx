import type { DividerBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';

interface Props {
  block: DividerBlock;
}

export function DividerSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateStyle = (style: Partial<DividerBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Divider Style</div>
        <div className="form-group">
          <label>Line Style</label>
          <select
            value={block.style.lineStyle || 'solid'}
            onChange={(e) => updateStyle({ lineStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
        <div className="form-group">
          <label>Line Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.lineColor || '#cccccc'} onChange={(e) => updateStyle({ lineColor: e.target.value })} />
            <input type="text" value={block.style.lineColor || '#cccccc'} onChange={(e) => updateStyle({ lineColor: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Line Thickness" value={block.style.lineThickness || 1} min={1} max={10} onChange={(v) => updateStyle({ lineThickness: v })} />
        <SliderInput label="Spacing" value={block.style.spacing || 20} min={0} max={100} onChange={(v) => updateStyle({ spacing: v })} />
      </div>
    </div>
  );
}
