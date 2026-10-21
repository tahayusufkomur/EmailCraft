import { useMemo, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { exportToHtml } from '../../lib/htmlExporter';

export type PreviewDevice = 'desktop' | 'mobile';

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

export function DeviceToggle({ value, onChange }: { value: PreviewDevice; onChange: (d: PreviewDevice) => void }) {
  return (
    <div style={styles.deviceToggle}>
      <button
        style={{ ...styles.deviceBtn, ...(value === 'desktop' ? styles.deviceBtnActive : {}) }}
        onClick={() => onChange('desktop')}
      >
        <IconDesktop />
        Desktop
      </button>
      <button
        style={{ ...styles.deviceBtn, ...(value === 'mobile' ? styles.deviceBtnActive : {}) }}
        onClick={() => onChange('mobile')}
      >
        <IconMobile />
        Mobile
      </button>
    </div>
  );
}

/** The exported email as a full-height card in a scroller padded like the canvas, so the two
 *  line up side by side. `lockScroll` ties its scroll to the editor canvas beside it. */
export function PreviewPane({ device, lockScroll = false }: { device: PreviewDevice; lockScroll?: boolean }) {
  const template = useEditorStore((s) => s.template);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // The iframe is as tall as the email so the pane scrolls, not the iframe. `body` is
  // height: 100% in the export, so the height comes from its children.
  const fitHeight = () => {
    const iframe = iframeRef.current;
    const body = iframe?.contentDocument?.body;
    if (!iframe || !body) return;
    const bottom = Math.max(0, ...Array.from(body.children, (el) => el.getBoundingClientRect().bottom));
    iframe.style.height = `${Math.ceil(bottom)}px`;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const observer = new ResizeObserver(fitHeight); // width changes reflow the email
    observer.observe(iframe);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const preview = scrollerRef.current;
    const canvas = lockScroll ? preview?.parentElement?.querySelector<HTMLElement>('.canvas-area:not(.preview-area)') : null;
    if (!preview || !canvas) return;
    // Matched by how far down each one is: the editor and the email are not the same height.
    // `echo` swallows the scroll event our own scrollTop write causes on the other side.
    let echo: Element | null = null;
    const sync = (from: Element, to: Element) => {
      if (echo === from) return;
      echo = to;
      to.scrollTop = scrollRatio(from) * (to.scrollHeight - to.clientHeight);
      requestAnimationFrame(() => { echo = null; });
    };
    const fromCanvas = () => sync(canvas, preview);
    const fromPreview = () => sync(preview, canvas);
    canvas.addEventListener('scroll', fromCanvas);
    preview.addEventListener('scroll', fromPreview);
    fromCanvas();
    return () => {
      canvas.removeEventListener('scroll', fromCanvas);
      preview.removeEventListener('scroll', fromPreview);
    };
  }, [lockScroll]);

  const html = useMemo(() => exportToHtml(template, 'placeholders'), [template]);

  return (
    <div ref={scrollerRef} className="canvas-area preview-area">
      <div className="preview-card" style={{ width: device === 'desktop' ? 640 : 375 }}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          onLoad={fitHeight}
          style={styles.iframe}
          sandbox="allow-same-origin"
          title="Email preview"
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  iframe: {
    width: '100%',
    height: 0,
    border: 'none',
    background: '#ffffff',
    display: 'block',
  },
};
