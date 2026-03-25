import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { useConfigStore } from '../../store/configStore';
import { useEditorStore } from '../../store/editorStore';
import { insertAtCursor, restoreCursor } from '../../lib/variableUtils';

export function VariableInserter() {
  const variables = useConfigStore((s) => s.variables);
  const tiptapEditor = useEditorStore((s) => s.tiptapEditor);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Track the last focused input/textarea so we can insert into it even after
  // the dropdown button steals focus.
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        lastFocusedRef.current = target;
      }
    };
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  if (variables.length === 0) return null;

  const handleInsert = (variableKey: string) => {
    const text = `{{${variableKey}}}`;

    // 1. Try tiptap editor (Text blocks on the canvas)
    if (tiptapEditor && tiptapEditor.isFocused) {
      tiptapEditor.chain().focus().insertContent(text).run();
      setIsOpen(false);
      return;
    }

    // 2. Try last focused input/textarea (settings panel fields)
    const input = lastFocusedRef.current;
    if (input && document.body.contains(input)) {
      const { newValue, cursorPos } = insertAtCursor(input, input.value, text);
      // Trigger React's onChange by using native setter
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value',
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value',
      )?.set;
      nativeSetter?.call(input, newValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      restoreCursor(input, cursorPos);
      setIsOpen(false);
      return;
    }

    // 3. Fallback: try tiptap even if not focused (selected text block)
    if (tiptapEditor) {
      tiptapEditor.chain().focus().insertContent(text).run();
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {'{{ }}'} Variables
      </Button>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, background: 'var(--mc-surface, white)',
          border: '1px solid var(--mc-border, #e2e8f0)', borderRadius: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          zIndex: 100, minWidth: 220, marginTop: 4,
        }}>
          {variables.map((v) => (
            <div
              key={v.key}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                borderBottom: '1px solid var(--mc-border-light, #f0f0f0)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--mc-hover, #f7fafc)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              onClick={() => handleInsert(v.key)}
            >
              <div style={{ fontWeight: 500 }}>{v.label}</div>
              <div style={{ fontSize: 11, color: 'var(--mc-muted, #718096)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{`{{${v.key}}}`}</span>
                {v.defaultValue && (
                  <span style={{ fontStyle: 'italic' }}>default: {v.defaultValue}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
