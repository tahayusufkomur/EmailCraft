import { useRef } from 'react';
import type { ImageBlock } from '../../../types/blocks';
import { useEditorStore } from '../../../store/editorStore';
import { AlignmentPicker } from './AlignmentPicker';
import { SpacingControl } from './SpacingControl';
import { VariableInserter } from '../VariableInserter';
import { insertAtCursor, restoreCursor } from '../../../lib/variableUtils';

interface Props {
  block: ImageBlock;
}

export function ImageSettings({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const altInputRef = useRef<HTMLInputElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const update = (data: Partial<ImageBlock['data']>) => {
    updateBlock(block.id, { data: { ...block.data, ...data } } as Partial<ImageBlock>);
  };

  const handleInsertAltVariable = (variable: string) => {
    const { newValue, cursorPos } = insertAtCursor(altInputRef.current, block.data.alt, variable);
    update({ alt: newValue });
    restoreCursor(altInputRef.current, cursorPos);
  };

  const handleInsertLinkVariable = (variable: string) => {
    const { newValue, cursorPos } = insertAtCursor(linkInputRef.current, block.data.link || '', variable);
    update({ link: newValue });
    restoreCursor(linkInputRef.current, cursorPos);
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
          <input ref={altInputRef} type="text" value={block.data.alt} onChange={(e) => update({ alt: e.target.value })} />
          <VariableInserter onInsert={handleInsertAltVariable} />
        </div>
        <div className="form-group">
          <label>Link URL</label>
          <input ref={linkInputRef} type="url" value={block.data.link || ''} onChange={(e) => update({ link: e.target.value })} />
          <VariableInserter onInsert={handleInsertLinkVariable} />
        </div>
        <div className="form-group">
          <label>Width (px)</label>
          <input type="number" min={50} max={600} value={block.data.width} onChange={(e) => update({ width: Number(e.target.value) })} />
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
