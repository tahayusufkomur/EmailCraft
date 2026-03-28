import { useCallback, useRef, useState } from 'react';

interface UseInlineEditOptions {
  getValue: () => string;
  onCommit: (value: string) => void;
}

export function useInlineEdit({ getValue, onCommit }: UseInlineEditOptions) {
  const ref = useRef<HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const originalValueRef = useRef('');

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
    const el = ref.current;
    if (el) {
      el.contentEditable = 'false';
      el.removeAttribute('contenteditable');
    }
  }, []);

  const commit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const value = (el.innerText || '').replace(/\n/g, '').trim();
    exitEditMode();
    onCommit(value);
  }, [exitEditMode, onCommit]);

  const cancel = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.innerText = originalValueRef.current;
    exitEditMode();
  }, [exitEditMode]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }, [commit, cancel]);

  const handleBlur = useCallback(() => {
    commit();
  }, [commit]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text);
  }, []);

  const suppressDrag = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = ref.current;
    if (!el) return;

    originalValueRef.current = getValue();
    setIsEditing(true);
    el.contentEditable = 'true';
    el.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    el.addEventListener('keydown', handleKeyDown);
    el.addEventListener('blur', handleBlur);
    el.addEventListener('paste', handlePaste);

    // Cleanup when editing ends
    const observer = new MutationObserver(() => {
      if (el.contentEditable !== 'true') {
        el.removeEventListener('keydown', handleKeyDown);
        el.removeEventListener('blur', handleBlur);
        el.removeEventListener('paste', handlePaste);
        observer.disconnect();
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ['contenteditable'] });
  }, [getValue, handleKeyDown, handleBlur, handlePaste]);

  return {
    ref,
    isEditing,
    handleDoubleClick,
    suppressDrag,
  };
}
