import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const VARIABLE_REGEX = /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g;

export const VariableHighlight = Extension.create({
  name: 'variableHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (!node.isText || !node.text) return;
              VARIABLE_REGEX.lastIndex = 0;
              let match;
              while ((match = VARIABLE_REGEX.exec(node.text)) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;
                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'variable-chip',
                    style:
                      'background-color: #dbeafe; color: #1e40af; border-radius: 3px; padding: 1px 4px; font-family: monospace; font-size: 0.9em;',
                  }),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
