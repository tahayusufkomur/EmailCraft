import { useEffect, useState } from 'react';
import './App.css';
import { Canvas } from './components/Editor/Canvas';
import { BlockPalette } from './components/Panels/BlockPalette';
import { StylePanel } from './components/Panels/StylePanel';
import { PreviewModal } from './components/Preview/PreviewModal';
import { TemplateGallery } from './components/Gallery/TemplateGallery';
import { useEditorStore } from './store/editorStore';
import { exportToHtml } from './lib/htmlExporter';
import { useAutoSave, loadDraft } from './hooks/useAutoSave';
import { sendReadyEvent, sendSaveEvent } from './lib/postMessage';

function App() {
  const isDirty = useEditorStore((s) => s.isDirty);
  const template = useEditorStore((s) => s.template);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const [showPreview, setShowPreview] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  // Auto-save
  useAutoSave();

  // Restore draft on load + notify parent iframe
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      loadTemplate(draft);
    }
    sendReadyEvent();
  }, [loadTemplate]);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('mailcraft_draft', JSON.stringify(template));
    useEditorStore.getState().markClean();

    // Send to parent iframe
    const html = exportToHtml(template, 'placeholders');
    sendSaveEvent(html, template);

    console.log('Template saved.');
  };

  const handleExport = () => {
    const html = exportToHtml(template, 'placeholders');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="top-toolbar">
        <div style={{ fontWeight: 600, fontSize: 15 }}>MailCraft Editor</div>
        <div className="top-toolbar-actions">
          <button className="btn" onClick={() => setShowGallery(true)}>
            Gallery
          </button>
          <button className="btn" onClick={() => setShowPreview(true)}>
            Preview
          </button>
          <button className="btn" onClick={handleSave}>
            Save {isDirty ? '*' : ''}
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export HTML
          </button>
        </div>
      </div>
      <div className="editor-layout">
        <BlockPalette />
        <Canvas />
        <StylePanel />
      </div>
      {showPreview && <PreviewModal onClose={() => setShowPreview(false)} />}
      {showGallery && <TemplateGallery onClose={() => setShowGallery(false)} />}
    </div>
  );
}

export default App;
