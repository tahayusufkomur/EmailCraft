import { useRef } from 'react';
import type { ButtonBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { VariableInserter } from '../VariableInserter';
import { insertAtCursor, restoreCursor } from '../../../lib/variableUtils';
import { FONT_OPTIONS } from '../../../lib/fonts';
import { SliderInput } from './SliderInput';

interface Props {
  block: ButtonBlock;
}

export function ButtonSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const textInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const updateData = (data: Partial<ButtonBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<ButtonBlock>);
  };

  const updateStyle = (style: Partial<ButtonBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  const handleInsertTextVariable = (variable: string) => {
    const { newValue, cursorPos } = insertAtCursor(textInputRef.current, block.data.text, variable);
    updateData({ text: newValue });
    restoreCursor(textInputRef.current, cursorPos);
  };

  const handleInsertUrlVariable = (variable: string) => {
    const { newValue, cursorPos } = insertAtCursor(urlInputRef.current, block.data.url, variable);
    updateData({ url: newValue });
    restoreCursor(urlInputRef.current, cursorPos);
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Button Content</div>
        <div className="form-group">
          <label>Button Text</label>
          <input ref={textInputRef} type="text" value={block.data.text} onChange={(e) => updateData({ text: e.target.value })} />
          <VariableInserter onInsert={handleInsertTextVariable} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input ref={urlInputRef} type="url" value={block.data.url} onChange={(e) => updateData({ url: e.target.value })} />
          <VariableInserter onInsert={handleInsertUrlVariable} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Style</div>
        <div className="form-group">
          <label>Background Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
            <input type="text" value={block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Text Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.color || '#ffffff'} onChange={(e) => updateStyle({ color: e.target.value })} />
            <input type="text" value={block.style.color || '#ffffff'} onChange={(e) => updateStyle({ color: e.target.value })} />
          </div>
        </div>
        <SliderInput label="Border Radius" value={block.style.borderRadius || 4} min={0} max={50} onChange={(v) => updateStyle({ borderRadius: v })} />
        <SliderInput label="Horizontal Padding" value={block.style.paddingX || 24} min={8} max={60} onChange={(v) => updateStyle({ paddingX: v })} />
        <SliderInput label="Vertical Padding" value={block.style.paddingY || 12} min={6} max={30} onChange={(v) => updateStyle({ paddingY: v })} />
        <SliderInput label="Font Size" value={block.style.fontSize || 16} min={10} max={32} onChange={(v) => updateStyle({ fontSize: v })} />
        <div className="form-group">
          <label>Font Family</label>
          <select value={block.style.fontFamily || FONT_OPTIONS[0].value} onChange={(e) => updateStyle({ fontFamily: e.target.value })}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}{f.isGoogle ? ' ✦' : ''}</option>
            ))}
          </select>
        </div>
        <SliderInput label="Font Weight" value={block.style.fontWeight || 600} min={300} max={900} step={100} unit="" onChange={(v) => updateStyle({ fontWeight: v })} />
        <div className="form-group">
          <label>Text Transform</label>
          <select value={block.style.textTransform || 'none'} onChange={(e) => updateStyle({ textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' })}>
            <option value="none">None</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
        <SliderInput label="Letter Spacing" value={block.style.letterSpacing || 0} min={0} max={8} step={0.5} onChange={(v) => updateStyle({ letterSpacing: v })} />
        <div className="toggle-row">
          <label>Full Width</label>
          <input type="checkbox" checked={block.style.fullWidth || false} onChange={(e) => updateStyle({ fullWidth: e.target.checked })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Border</div>
        <SliderInput label="Border Width" value={block.style.borderWidth || 0} min={0} max={12} onChange={(v) => updateStyle({ borderWidth: v })} />
        <div className="form-group">
          <label>Border Style</label>
          <select value={block.style.borderStyle || 'solid'} onChange={(e) => updateStyle({ borderStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </div>
        <div className="form-group">
          <label>Border Color</label>
          <div className="color-input-row">
            <input type="color" value={block.style.borderColor || block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
            <input type="text" value={block.style.borderColor || block.style.backgroundColor || '#007bff'} onChange={(e) => updateStyle({ borderColor: e.target.value })} />
          </div>
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
