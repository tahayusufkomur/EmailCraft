import type { HeadingBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { FONT_OPTIONS } from '../../../lib/fonts';
import { SliderInput } from './SliderInput';

interface Props {
  block: HeadingBlock;
}

export function HeadingSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const updateData = (data: Partial<HeadingBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<HeadingBlock>);
  };

  const updateStyle = (style: Partial<HeadingBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Heading Content</div>
        <div className="form-group">
          <label>Text</label>
          <input
            type="text"
            value={block.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Level</label>
          <select
            value={block.data.level}
            onChange={(e) => updateData({ level: Number(e.target.value) as 1 | 2 | 3 | 4 })}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Typography</div>
        <div className="form-group">
          <label>Font Family</label>
          <select
            value={block.style.fontFamily}
            onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}{f.isGoogle ? ' ✦' : ''}
              </option>
            ))}
          </select>
        </div>
        <SliderInput label="Font Size" value={block.style.fontSize || 28} min={12} max={72} onChange={(v) => updateStyle({ fontSize: v })} />
        <SliderInput label="Font Weight" value={block.style.fontWeight || 700} min={300} max={900} step={100} unit="" onChange={(v) => updateStyle({ fontWeight: v })} />
        <SliderInput label="Letter Spacing" value={block.style.letterSpacing || 0} min={-2} max={20} step={0.5} onChange={(v) => updateStyle({ letterSpacing: v })} />
        <div className="form-group">
          <label>Text Transform</label>
          <select
            value={block.style.textTransform || 'none'}
            onChange={(e) => updateStyle({ textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' })}
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
        <div className="form-group">
          <label>Text Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={block.style.color || '#0f172a'}
              onChange={(e) => updateStyle({ color: e.target.value })}
            />
            <input
              type="text"
              value={block.style.color || '#0f172a'}
              onChange={(e) => updateStyle({ color: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Alignment</div>
        <AlignmentPicker
          value={block.style.alignment || 'left'}
          onChange={(alignment) => updateStyle({ alignment })}
        />
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Padding</div>
        <SpacingControl
          value={block.style.padding || { top: 10, right: 20, bottom: 10, left: 20 }}
          onChange={(padding) => updateStyle({ padding })}
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
