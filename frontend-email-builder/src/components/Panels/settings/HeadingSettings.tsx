import { useRef } from 'react';
import type { HeadingBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { VariableInserter } from '../VariableInserter';
import { insertAtCursor, restoreCursor } from '../../../lib/variableUtils';

interface Props {
  block: HeadingBlock;
}

const WEB_SAFE_FONTS = [
  'Arial, Helvetica, sans-serif',
  'Georgia, "Times New Roman", Times, serif',
  '"Trebuchet MS", Helvetica, sans-serif',
  'Verdana, Geneva, sans-serif',
  '"Courier New", Courier, monospace',
];

export function HeadingSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const textInputRef = useRef<HTMLInputElement>(null);

  const updateData = (data: Partial<HeadingBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<HeadingBlock>);
  };

  const updateStyle = (style: Partial<HeadingBlock['style']>) => {
    updateBlock(block.id, { style: { ...block.style, ...style } });
  };

  const handleInsertVariable = (variable: string) => {
    const { newValue, cursorPos } = insertAtCursor(textInputRef.current, block.data.text, variable);
    updateData({ text: newValue });
    restoreCursor(textInputRef.current, cursorPos);
  };

  return (
    <div>
      <div className="panel-section">
        <div className="panel-section-title">Heading Content</div>
        <div className="form-group">
          <label>Text</label>
          <input
            ref={textInputRef}
            type="text"
            value={block.data.text}
            onChange={(e) => updateData({ text: e.target.value })}
          />
        </div>
        <VariableInserter onInsert={handleInsertVariable} />
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
            {WEB_SAFE_FONTS.map((font) => (
              <option key={font} value={font}>
                {font.split(',')[0].replace(/"/g, '')}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Font Size (px)</label>
          <input
            type="number"
            min={12}
            max={72}
            value={block.style.fontSize || 28}
            onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
          />
        </div>
        <div className="form-group">
          <label>Font Weight</label>
          <input
            type="number"
            min={300}
            max={900}
            step={100}
            value={block.style.fontWeight || 700}
            onChange={(e) => updateStyle({ fontWeight: Number(e.target.value) })}
          />
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
