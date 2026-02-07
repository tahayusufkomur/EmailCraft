import { useRef } from 'react';
import type { ButtonBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { VariableInserter } from '../VariableInserter';
import { insertAtCursor, restoreCursor } from '../../../lib/variableUtils';

interface Props {
  block: ButtonBlock;
}

const WEB_SAFE_FONTS = [
  'Arial, Helvetica, sans-serif',
  'Georgia, "Times New Roman", Times, serif',
  '"Trebuchet MS", Helvetica, sans-serif',
  'Verdana, Geneva, sans-serif',
  '"Courier New", Courier, monospace',
];

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
        <div className="form-group">
          <label>Border Radius (px)</label>
          <input type="number" min={0} max={50} value={block.style.borderRadius || 4} onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Horizontal Padding (px)</label>
          <input type="number" min={8} max={60} value={block.style.paddingX || 24} onChange={(e) => updateStyle({ paddingX: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Vertical Padding (px)</label>
          <input type="number" min={6} max={30} value={block.style.paddingY || 12} onChange={(e) => updateStyle({ paddingY: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Font Size (px)</label>
          <input type="number" min={10} max={32} value={block.style.fontSize || 16} onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Font Family</label>
          <select value={block.style.fontFamily || WEB_SAFE_FONTS[0]} onChange={(e) => updateStyle({ fontFamily: e.target.value })}>
            {WEB_SAFE_FONTS.map((font) => (
              <option key={font} value={font}>{font.split(',')[0].replace(/"/g, '')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Font Weight</label>
          <input type="number" min={300} max={900} step={100} value={block.style.fontWeight || 600} onChange={(e) => updateStyle({ fontWeight: Number(e.target.value) })} />
        </div>
        <div className="form-group">
          <label>Text Transform</label>
          <select value={block.style.textTransform || 'none'} onChange={(e) => updateStyle({ textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase' | 'capitalize' })}>
            <option value="none">None</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </div>
        <div className="form-group">
          <label>Letter Spacing (px)</label>
          <input type="number" min={0} max={8} step={0.5} value={block.style.letterSpacing || 0} onChange={(e) => updateStyle({ letterSpacing: Number(e.target.value) })} />
        </div>
        <div className="toggle-row">
          <label>Full Width</label>
          <input type="checkbox" checked={block.style.fullWidth || false} onChange={(e) => updateStyle({ fullWidth: e.target.checked })} />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">Border</div>
        <div className="form-group">
          <label>Border Width (px)</label>
          <input type="number" min={0} max={12} value={block.style.borderWidth || 0} onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })} />
        </div>
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
