import { create } from 'zustand';
import type { Block, EmailTemplate, TemplateSettings } from '../types/blocks';

const DEFAULT_SETTINGS: TemplateSettings = {
  backgroundColor: '#f4f4f4',
  contentWidth: 600,
  defaultFont: 'Arial, Helvetica, sans-serif',
  defaultFontSize: 14,
  defaultColor: '#333333',
};

const EMPTY_TEMPLATE: EmailTemplate = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  header: { blocks: [] },
  body: { blocks: [] },
  footer: { blocks: [] },
};

interface EditorState {
  template: EmailTemplate;
  selectedBlockId: string | null;
  isDirty: boolean;
  activeSection: 'header' | 'body' | 'footer';

  // Actions
  addBlock: (block: Block, index?: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  duplicateBlock: (id: string) => void;
  updateSettings: (settings: Partial<TemplateSettings>) => void;
  loadTemplate: (template: EmailTemplate) => void;
  resetTemplate: () => void;
  setActiveSection: (section: 'header' | 'body' | 'footer') => void;
  markClean: () => void;

  // Getters
  getSelectedBlock: () => Block | null;
  getBodyBlocks: () => Block[];
}

export const useEditorStore = create<EditorState>((set, get) => ({
  template: EMPTY_TEMPLATE,
  selectedBlockId: null,
  isDirty: false,
  activeSection: 'body',

  addBlock: (block, index) => {
    set((state) => {
      const section = state.activeSection;
      const blocks = [...state.template[section].blocks];
      if (index !== undefined) {
        blocks.splice(index, 0, block);
      } else {
        blocks.push(block);
      }
      return {
        template: {
          ...state.template,
          [section]: { blocks },
        },
        isDirty: true,
        selectedBlockId: block.id,
      };
    });
  },

  updateBlock: (id, updates) => {
    set((state) => {
      const updateInBlocks = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.id === id) {
            return { ...b, ...updates } as Block;
          }
          if (b.type === 'columns') {
            return {
              ...b,
              data: {
                ...b.data,
                columns: b.data.columns.map((col) => ({
                  ...col,
                  blocks: updateInBlocks(col.blocks),
                })),
              },
            };
          }
          return b;
        });

      return {
        template: {
          ...state.template,
          header: { blocks: updateInBlocks(state.template.header.blocks) },
          body: { blocks: updateInBlocks(state.template.body.blocks) },
          footer: { blocks: updateInBlocks(state.template.footer.blocks) },
        },
        isDirty: true,
      };
    });
  },

  deleteBlock: (id) => {
    set((state) => {
      const filterBlocks = (blocks: Block[]): Block[] =>
        blocks
          .filter((b) => b.id !== id)
          .map((b) => {
            if (b.type === 'columns') {
              return {
                ...b,
                data: {
                  ...b.data,
                  columns: b.data.columns.map((col) => ({
                    ...col,
                    blocks: filterBlocks(col.blocks),
                  })),
                },
              };
            }
            return b;
          });

      return {
        template: {
          ...state.template,
          header: { blocks: filterBlocks(state.template.header.blocks) },
          body: { blocks: filterBlocks(state.template.body.blocks) },
          footer: { blocks: filterBlocks(state.template.footer.blocks) },
        },
        isDirty: true,
        selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      };
    });
  },

  moveBlock: (fromIndex, toIndex) => {
    set((state) => {
      const section = state.activeSection;
      const blocks = [...state.template[section].blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      return {
        template: {
          ...state.template,
          [section]: { blocks },
        },
        isDirty: true,
      };
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  duplicateBlock: (id) => {
    const state = get();
    const allBlocks = [
      ...state.template.header.blocks,
      ...state.template.body.blocks,
      ...state.template.footer.blocks,
    ];
    const block = allBlocks.find((b) => b.id === id);
    if (!block) return;

    const newBlock = {
      ...JSON.parse(JSON.stringify(block)),
      id: crypto.randomUUID(),
    };

    // Find which section it's in and insert after
    for (const section of ['header', 'body', 'footer'] as const) {
      const idx = state.template[section].blocks.findIndex((b) => b.id === id);
      if (idx !== -1) {
        set((s) => {
          const blocks = [...s.template[section].blocks];
          blocks.splice(idx + 1, 0, newBlock);
          return {
            template: { ...s.template, [section]: { blocks } },
            isDirty: true,
            selectedBlockId: newBlock.id,
          };
        });
        return;
      }
    }
  },

  updateSettings: (settings) => {
    set((state) => ({
      template: {
        ...state.template,
        settings: { ...state.template.settings, ...settings },
      },
      isDirty: true,
    }));
  },

  loadTemplate: (template) => set({ template, isDirty: false, selectedBlockId: null }),
  resetTemplate: () => set({ template: EMPTY_TEMPLATE, isDirty: false, selectedBlockId: null }),
  setActiveSection: (section) => set({ activeSection: section }),
  markClean: () => set({ isDirty: false }),

  getSelectedBlock: () => {
    const state = get();
    if (!state.selectedBlockId) return null;
    const allBlocks = [
      ...state.template.header.blocks,
      ...state.template.body.blocks,
      ...state.template.footer.blocks,
    ];
    return allBlocks.find((b) => b.id === state.selectedBlockId) || null;
  },

  getBodyBlocks: () => get().template.body.blocks,
}));
