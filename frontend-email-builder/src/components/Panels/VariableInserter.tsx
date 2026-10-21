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

    if (tiptapEditor && tiptapEditor.isFocused) {
      tiptapEditor.chain().focus().insertContent(text).run();
      setIsOpen(false);
      return;
    }

    const input = lastFocusedRef.current;
    if (input && document.body.contains(input)) {
      const { newValue, cursorPos } = insertAtCursor(input, input.value, text);
      const nativeSetter =
        Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set ||
        Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      nativeSetter?.call(input, newValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      restoreCursor(input, cursorPos);
      setIsOpen(false);
      return;
    }

    if (tiptapEditor) {
      tiptapEditor.chain().focus().insertContent(text).run();
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
        {'{{ }}'} Variables
      </Button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'var(--chrome-surface)',
            color: 'var(--chrome-text-primary)',
            border: '1px solid var(--chrome-border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            minWidth: 230,
            marginTop: 6,
            overflow: 'hidden',
          }}
        >
          {variables.map((v) => (
            <div
              key={v.key}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: 13,
                borderBottom: '1px solid var(--chrome-border)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--chrome-surface-elevated)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
              onClick={() => handleInsert(v.key)}
            >
              <div style={{ fontWeight: 500 }}>{v.label}</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--chrome-text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 2,
                  fontFamily: "'Geist Mono', ui-monospace, monospace",
                }}
              >
                <span style={{ color: 'var(--accent-color)' }}>{`{{${v.key}}}`}</span>
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
