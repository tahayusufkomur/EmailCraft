import { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useConfigStore } from '../../store/configStore';
import { exportToHtml } from '../../lib/htmlExporter';
import { substituteVariablesClientSide } from '../../lib/variableUtils';

interface Props {
  onClose: () => void;
}

type ViewMode = 'desktop' | 'mobile';

const IconDesktop = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconMobile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconVariables = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    <path d="M7.5 15 10 9l2.5 6" /><path d="M8.5 13h3" /><path d="m14 9 2 6 2-6" />
  </svg>
);

export function PreviewModal({ onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [showDefaults, setShowDefaults] = useState(false);
  const template = useEditorStore((s) => s.template);
  const variables = useConfigStore((s) => s.variables);

  const html = useMemo(() => {
    if (showDefaults && variables.length > 0) {
      const defaults: Record<string, string> = {};
      for (const v of variables) {
        defaults[v.key] = v.defaultValue || `[${v.label}]`;
      }
      const substituted = substituteVariablesClientSide(template, defaults);
      return exportToHtml(substituted, 'defaults');
    }
    return exportToHtml(template, 'placeholders');
  }, [template, showDefaults, variables]);

  const width = viewMode === 'desktop' ? 640 : 375;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <span style={styles.title}>Preview</span>
            <div style={styles.deviceToggle}>
              <button
                style={{
                  ...styles.deviceBtn,
                  ...(viewMode === 'desktop' ? styles.deviceBtnActive : {}),
                }}
                onClick={() => setViewMode('desktop')}
                title="Desktop"
              >
                <IconDesktop />
              </button>
              <button
                style={{
                  ...styles.deviceBtn,
                  ...(viewMode === 'mobile' ? styles.deviceBtnActive : {}),
                }}
                onClick={() => setViewMode('mobile')}
                title="Mobile"
              >
                <IconMobile />
              </button>
            </div>
            <span style={styles.widthLabel}>{width}px</span>
            {variables.length > 0 && (
              <button
                style={{
                  ...styles.variableBtn,
                  ...(showDefaults ? styles.variableBtnActive : {}),
                }}
                onClick={() => setShowDefaults(!showDefaults)}
              >
                <IconVariables />
                {showDefaults ? 'Placeholders' : 'Sample Data'}
              </button>
            )}
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close preview">
            <IconClose />
          </button>
        </div>

        {/* Preview */}
        <div style={styles.previewArea}>
          <div style={{
            ...styles.iframeWrapper,
            width,
          }}>
            <iframe
              srcDoc={html}
              style={styles.iframe}
              sandbox="allow-same-origin"
              title="Email preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 6, 23, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#ffffff',
    borderRadius: 14,
    width: '92vw',
    maxWidth: 960,
    height: '88vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#fafbfc',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
    letterSpacing: '0.02em',
  },
  deviceToggle: {
    display: 'flex',
    background: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  deviceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 30,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  deviceBtnActive: {
    background: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  widthLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: '#94a3b8',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    letterSpacing: '-0.02em',
  },
  variableBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    fontSize: 12,
    fontWeight: 500,
    color: '#64748b',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  variableBtnActive: {
    background: '#eff6ff',
    borderColor: '#93c5fd',
    color: '#2563eb',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  previewArea: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 24,
    background: 'repeating-conic-gradient(#f1f5f9 0% 25%, #fafbfc 0% 50%) 50% / 20px 20px',
  },
  iframeWrapper: {
    maxWidth: '100%',
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#ffffff',
    display: 'block',
  },
};
