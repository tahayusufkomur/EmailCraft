import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import type { TextBlock as TextBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { VariableHighlight } from '../../lib/tiptapVariableExtension';

const VAR_EXTRACT = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

interface Props {
  block: TextBlockType;
}

export function TextBlock({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const setTiptapEditor = useEditorStore((s) => s.setTiptapEditor);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Type your text here...' }),
      VariableHighlight,
    ],
    content: block.data.html,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const vars = [...html.matchAll(VAR_EXTRACT)].map((m) => m[1]);
      const uniqueVars = [...new Set(vars)];
      updateBlock(block.id, {
        data: { html, variables: uniqueVars },
      } as Partial<TextBlockType>);
    },
  });

  // Bridge the tiptap editor to the store so TextSettings can use it
  useEffect(() => {
    if (editor && selectedBlockId === block.id) {
      setTiptapEditor(editor);
    }
    return () => {
      if (useEditorStore.getState().tiptapEditor === editor) {
        setTiptapEditor(null);
      }
    };
  }, [editor, selectedBlockId, block.id, setTiptapEditor]);

  return (
    <div
      className="text-block-content"
      style={{
        padding: `${block.style.padding?.top ?? 10}px ${block.style.padding?.right ?? 20}px ${block.style.padding?.bottom ?? 10}px ${block.style.padding?.left ?? 20}px`,
        textAlign: block.style.alignment || 'left',
        backgroundColor: block.style.backgroundColor ?? 'transparent',
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
