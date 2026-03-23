import { useMemo, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportToHtml } from '../../lib/htmlExporter';

export function RawHtmlView() {
  const template = useEditorStore((s) => s.template);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const html = useMemo(() => exportToHtml(template), [template]);

  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      navigator.clipboard.writeText(html);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>Raw HTML Output</span>
        <button onClick={handleCopy} style={styles.copyBtn}>
          Copy to Clipboard
        </button>
      </div>
      <textarea
        ref={textareaRef}
        readOnly
        value={html}
        style={styles.textarea}
        spellCheck={false}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    color: '#334155',
  },
  textarea: {
    flex: 1,
    width: '100%',
    padding: 16,
    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: 1.6,
    color: '#1e293b',
    background: '#f8fafc',
    border: 'none',
    outline: 'none',
    resize: 'none',
    tabSize: 2,
  },
};
