import type { SpacerBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SliderInput } from './SliderInput';

interface Props {
  block: SpacerBlock;
}

export function SpacerSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateStyle = (style: Partial<SpacerBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Spacer</div>
        <SliderInput label="Height" value={block.style.height || 32} min={0} max={240} onChange={(v) => updateStyle({ height: v })} />
        <div className="form-group">
          <label>Background</label>
          <div className="color-input-row">
            <input
              type="color"
              value={block.style.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
            />
            <input
              type="text"
              value={block.style.backgroundColor || ''}
              placeholder="transparent"
              onChange={(e) => updateStyle({ backgroundColor: e.target.value || null })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
