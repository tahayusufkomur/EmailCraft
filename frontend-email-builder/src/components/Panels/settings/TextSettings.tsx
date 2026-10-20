import type { TextBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { SpacingControl } from './SpacingControl';
import { AlignmentPicker } from './AlignmentPicker';
import { SliderInput } from './SliderInput';

interface Props {
  block: TextBlock;
}

export function TextSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Typography</div>
        <SliderInput label="Line Height" value={block.style.lineHeight ?? 1.6} min={1} max={2.2} step={0.05} unit="" onChange={(v) => updateBlock(block.id, { style: { ...block.style, lineHeight: v } })} />
      </div>
      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'left'}
          onChange={(alignment) => updateBlock(block.id, { style: { ...block.style, alignment } })}
        />
      </div>
      <div className="panel-section">
        <div className="panel-section-title">Padding</div>
        <SpacingControl
          value={block.style.padding || { top: 10, right: 20, bottom: 10, left: 20 }}
          onChange={(padding) => updateBlock(block.id, { style: { ...block.style, padding } })}
        />
      </div>
      <div className="panel-section">
        <div className="panel-section-title">Background</div>
        <div className="form-group">
          <label>Background Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={block.style.backgroundColor || '#ffffff'}
              onChange={(e) => updateBlock(block.id, { style: { ...block.style, backgroundColor: e.target.value } })}
            />
            <input
              type="text"
              value={block.style.backgroundColor || ''}
              placeholder="transparent"
              onChange={(e) => updateBlock(block.id, { style: { ...block.style, backgroundColor: e.target.value || null } })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
