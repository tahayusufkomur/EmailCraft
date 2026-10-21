import { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportToHtml } from '../../lib/htmlExporter';

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

export function PreviewModal({ onClose }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const template = useEditorStore((s) => s.template);

  const html = useMemo(() => exportToHtml(template, 'placeholders'), [template]);

  const width = viewMode === 'desktop' ? 640 : 375;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
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
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close preview">
            <IconClose />
          </button>
        </div>

        <div style={styles.previewArea}>
          <div
            style={{
              ...styles.iframeWrapper,
              width,
            }}
          >
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
    background: 'rgba(15, 14, 13, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'var(--chrome-surface)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 16,
    width: '92vw',
    maxWidth: 960,
    height: '88vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderBottom: '1px solid var(--chrome-border)',
    background: 'var(--chrome-surface)',
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
    color: 'var(--chrome-text-primary)',
    letterSpacing: '-0.01em',
  },
  deviceToggle: {
    display: 'flex',
    background: 'var(--chrome-surface-elevated)',
    border: '1px solid var(--chrome-border)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  deviceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--chrome-text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  deviceBtnActive: {
    background: 'var(--chrome-surface)',
    color: 'var(--chrome-text-primary)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
  },
  widthLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--chrome-text-muted)',
    fontFamily: "'Geist Mono', ui-monospace, monospace",
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
    color: 'var(--chrome-text-muted)',
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
    background: 'var(--canvas-bg)',
  },
  iframeWrapper: {
    maxWidth: '100%',
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--chrome-border)',
    boxShadow: 'var(--shadow-lg)',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#ffffff',
    display: 'block',
  },
};
