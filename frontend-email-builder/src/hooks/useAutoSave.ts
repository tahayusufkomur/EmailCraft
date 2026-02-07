import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

export function useAutoSave() {
  const template = useEditorStore((s) => s.template);
  const isDirty = useEditorStore((s) => s.isDirty);
  const markClean = useEditorStore((s) => s.markClean);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isDirty) return;

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      // Save to localStorage as draft
      try {
        localStorage.setItem('mailcraft_draft', JSON.stringify(template));
        markClean();
        console.log('[AutoSave] Draft saved to localStorage');
      } catch (err) {
        console.warn('[AutoSave] Failed to save draft:', err);
      }

      // Notify parent if in iframe
      if (window.parent !== window) {
        window.parent.postMessage(
          { source: 'mailcraft', type: 'MAILCRAFT_AUTO_SAVE', payload: { json: template } },
          '*', // In production, this should be the allowed parent origin
        );
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [template, isDirty, markClean]);
}

export function loadDraft() {
  try {
    const draft = localStorage.getItem('mailcraft_draft');
    if (draft) {
      return JSON.parse(draft);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}
