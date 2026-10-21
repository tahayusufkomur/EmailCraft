import { useState, useMemo, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportToHtml } from '../../lib/htmlExporter';

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

const scrollRatio = (el: Element) => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);

/** The exported email in an iframe, live with the editor, at desktop or mobile width.
 *  `lockScroll` ties its scroll to the editor canvas beside it. */
export function PreviewPane({ lockScroll = false }: { lockScroll?: boolean }) {
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const template = useEditorStore((s) => s.template);
  const paneRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const canvas = lockScroll ? paneRef.current?.parentElement?.querySelector<HTMLElement>('.canvas-area') : null;
    const iframe = iframeRef.current;
    if (!canvas || !iframe) return;
    // Matched by how far down each one is: the editor and the email are not the same height.
    // `echo` swallows the scroll event our own scrollTop write causes on the other side.
    let echo: Element | null = null;
    const sync = (from: Element | null | undefined, to: Element | null | undefined) => {
      if (!from || !to || echo === from) return;
      echo = to;
      to.scrollTop = scrollRatio(from) * (to.scrollHeight - to.clientHeight);
      requestAnimationFrame(() => { echo = null; });
    };
    const preview = () => iframe.contentDocument?.scrollingElement;
    const fromCanvas = () => sync(canvas, preview());
    const fromPreview = () => sync(preview(), canvas);
    let doc: Document | null = null;
    // The iframe reloads on every edit (srcDoc), so its listener and position are set again on load.
    const attach = () => {
      doc?.removeEventListener('scroll', fromPreview);
      doc = iframe.contentDocument;
      doc?.addEventListener('scroll', fromPreview);
      fromCanvas();
    };
    canvas.addEventListener('scroll', fromCanvas);
    iframe.addEventListener('load', attach);
    attach();
    return () => {
      canvas.removeEventListener('scroll', fromCanvas);
      iframe.removeEventListener('load', attach);
      doc?.removeEventListener('scroll', fromPreview);
    };
  }, [lockScroll]);

  const html = useMemo(() => exportToHtml(template, 'placeholders'), [template]);

  const width = viewMode === 'desktop' ? 640 : 375;

  return (
    <div ref={paneRef} style={styles.pane}>
      <div style={styles.toolbar}>
        <div style={styles.deviceToggle}>
          <button
            style={{
              ...styles.deviceBtn,
              ...(viewMode === 'desktop' ? styles.deviceBtnActive : {}),
            }}
            onClick={() => setViewMode('desktop')}
          >
            <IconDesktop />
            Desktop
          </button>
          <button
            style={{
              ...styles.deviceBtn,
              ...(viewMode === 'mobile' ? styles.deviceBtnActive : {}),
            }}
            onClick={() => setViewMode('mobile')}
          >
            <IconMobile />
            Mobile
          </button>
        </div>
        <span style={styles.widthLabel}>{width}px</span>
      </div>

      <div style={styles.previewArea}>
        <div
          style={{
            ...styles.iframeWrapper,
            width,
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={styles.iframe}
            sandbox="allow-same-origin"
            title="Email preview"
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pane: {
    flex: '1 1 50%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--canvas-bg)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: '12px 16px 0',
    flexShrink: 0,
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
    gap: 6,
    height: 28,
    padding: '0 10px',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
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
  previewArea: {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 24,
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
