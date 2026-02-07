import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import type { TextBlock as TextBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  block: TextBlockType;
}

export function TextBlock({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Type your text here...' }),
    ],
    content: block.data.html,
    onUpdate: ({ editor }) => {
      updateBlock(block.id, {
        data: { ...block.data, html: editor.getHTML() },
      } as Partial<TextBlockType>);
    },
  });

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
