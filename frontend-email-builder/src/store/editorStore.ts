import { create } from 'zustand';
import type { Editor } from '@tiptap/react';
import type { Block, EmailTemplate, TemplateSettings } from '../types/blocks';

const DEFAULT_SETTINGS: TemplateSettings = {
  backgroundColor: '#f4f4f4',
  backgroundStyle: 'none',
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

function findBlockById(blocks: Block[], id: string): Block | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === 'columns') {
      for (const column of block.data.columns) {
        const match = findBlockById(column.blocks, id);
        if (match) return match;
      }
    }
  }
  return null;
}

function cloneBlockWithNewIds(block: Block): Block {
  const cloned = JSON.parse(JSON.stringify(block)) as Block;

  const assignIdsRecursively = (target: Block): Block => {
    target.id = crypto.randomUUID();
    if (target.type === 'columns') {
      target.data.columns = target.data.columns.map((column) => ({
        ...column,
        id: crypto.randomUUID(),
        blocks: column.blocks.map((child) => assignIdsRecursively(child)),
      }));
    }
    return target;
  };

  return assignIdsRecursively(cloned);
}

function insertBlockIntoColumn(
  blocks: Block[],
  parentBlockId: string,
  columnId: string,
  newBlock: Block,
  index?: number,
): { blocks: Block[]; inserted: boolean } {
  let inserted = false;

  const updatedBlocks = blocks.map((block) => {
    if (block.type !== 'columns') return block;

    if (block.id === parentBlockId) {
      const updatedColumns = block.data.columns.map((column) => {
        if (column.id !== columnId) return column;
        const nextBlocks = [...column.blocks];
        if (index !== undefined && index >= 0 && index <= nextBlocks.length) {
          nextBlocks.splice(index, 0, newBlock);
        } else {
          nextBlocks.push(newBlock);
        }
        inserted = true;
        return { ...column, blocks: nextBlocks };
      });
      return { ...block, data: { ...block.data, columns: updatedColumns } };
    }

    const nestedColumns = block.data.columns.map((column) => {
      const result = insertBlockIntoColumn(column.blocks, parentBlockId, columnId, newBlock, index);
      if (result.inserted) {
        inserted = true;
        return { ...column, blocks: result.blocks };
      }
      return column;
    });

    if (inserted) {
      return { ...block, data: { ...block.data, columns: nestedColumns } };
    }
    return block;
  });

  return { blocks: inserted ? updatedBlocks : blocks, inserted };
}

function duplicateBlockInList(
  blocks: Block[],
  targetId: string,
): { blocks: Block[]; duplicatedId: string | null; changed: boolean } {
  let duplicatedId: string | null = null;
  let changed = false;
  const output: Block[] = [];

  for (const block of blocks) {
    if (block.id === targetId) {
      const duplicate = cloneBlockWithNewIds(block);
      output.push(block, duplicate);
      duplicatedId = duplicate.id;
      changed = true;
      continue;
    }

    if (block.type === 'columns') {
      let nestedChanged = false;
      const updatedColumns = block.data.columns.map((column) => {
        const nested = duplicateBlockInList(column.blocks, targetId);
        if (nested.changed) {
          nestedChanged = true;
          if (!duplicatedId) duplicatedId = nested.duplicatedId;
          return { ...column, blocks: nested.blocks };
        }
        return column;
      });

      if (nestedChanged) {
        output.push({ ...block, data: { ...block.data, columns: updatedColumns } });
        changed = true;
        continue;
      }
    }

    output.push(block);
  }

  return { blocks: changed ? output : blocks, duplicatedId, changed };
}

interface EditorState {
  template: EmailTemplate;
  selectedBlockId: string | null;
  isDirty: boolean;
  activeSection: 'header' | 'body' | 'footer';
  tiptapEditor: Editor | null;

  // Actions
  addBlock: (block: Block, index?: number) => void;
  addBlockToColumn: (parentBlockId: string, columnId: string, block: Block, index?: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  moveBlockWithinColumn: (parentBlockId: string, columnId: string, fromIndex: number, toIndex: number) => void;
  moveBlockBetweenColumns: (blockId: string, sourceParentId: string, sourceColumnId: string, targetParentId: string, targetColumnId: string, targetIndex?: number) => void;
  setTiptapEditor: (editor: Editor | null) => void;
  selectBlock: (id: string | null) => void;
  duplicateBlock: (id: string) => void;
  updateSettings: (settings: Partial<TemplateSettings>) => void;
  applyOrganizationBackground: (
    backgroundStyle: TemplateSettings['backgroundStyle'],
    backgroundColor: string,
  ) => void;
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
  tiptapEditor: null,

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

  addBlockToColumn: (parentBlockId, columnId, block, index) => {
    set((state) => {
      const headerResult = insertBlockIntoColumn(state.template.header.blocks, parentBlockId, columnId, block, index);
      const bodyResult = insertBlockIntoColumn(state.template.body.blocks, parentBlockId, columnId, block, index);
      const footerResult = insertBlockIntoColumn(state.template.footer.blocks, parentBlockId, columnId, block, index);
      const inserted = headerResult.inserted || bodyResult.inserted || footerResult.inserted;

      if (!inserted) return state;

      return {
        template: {
          ...state.template,
          header: { blocks: headerResult.blocks },
          body: { blocks: bodyResult.blocks },
          footer: { blocks: footerResult.blocks },
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

      const nextTemplate = {
        ...state.template,
        header: { blocks: filterBlocks(state.template.header.blocks) },
        body: { blocks: filterBlocks(state.template.body.blocks) },
        footer: { blocks: filterBlocks(state.template.footer.blocks) },
      };
      const stillSelected = state.selectedBlockId
        ? Boolean(findBlockById(
          [
            ...nextTemplate.header.blocks,
            ...nextTemplate.body.blocks,
            ...nextTemplate.footer.blocks,
          ],
          state.selectedBlockId,
        ))
        : false;

      return {
        template: {
          ...nextTemplate,
        },
        isDirty: true,
        selectedBlockId: stillSelected ? state.selectedBlockId : null,
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

  moveBlockWithinColumn: (parentBlockId, columnId, fromIndex, toIndex) => {
    set((state) => {
      const moveInBlocks = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.type !== 'columns') return b;
          if (b.id === parentBlockId) {
            const updatedColumns = b.data.columns.map((col) => {
              if (col.id !== columnId) return col;
              const newBlocks = [...col.blocks];
              const [moved] = newBlocks.splice(fromIndex, 1);
              newBlocks.splice(toIndex, 0, moved);
              return { ...col, blocks: newBlocks };
            });
            return { ...b, data: { ...b.data, columns: updatedColumns } };
          }
          const updatedColumns = b.data.columns.map((col) => ({
            ...col,
            blocks: moveInBlocks(col.blocks),
          }));
          return { ...b, data: { ...b.data, columns: updatedColumns } };
        });

      return {
        template: {
          ...state.template,
          header: { blocks: moveInBlocks(state.template.header.blocks) },
          body: { blocks: moveInBlocks(state.template.body.blocks) },
          footer: { blocks: moveInBlocks(state.template.footer.blocks) },
        },
        isDirty: true,
      };
    });
  },

  moveBlockBetweenColumns: (blockId, sourceParentId, sourceColumnId, targetParentId, targetColumnId, targetIndex) => {
    set((state) => {
      let movedBlock: Block | null = null;

      const removeFromColumn = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.type !== 'columns') return b;
          if (b.id === sourceParentId) {
            const updatedColumns = b.data.columns.map((col) => {
              if (col.id !== sourceColumnId) return col;
              const blockIndex = col.blocks.findIndex((block) => block.id === blockId);
              if (blockIndex !== -1) {
                movedBlock = col.blocks[blockIndex];
                const newBlocks = [...col.blocks];
                newBlocks.splice(blockIndex, 1);
                return { ...col, blocks: newBlocks };
              }
              return col;
            });
            return { ...b, data: { ...b.data, columns: updatedColumns } };
          }
          const updatedColumns = b.data.columns.map((col) => ({
            ...col,
            blocks: removeFromColumn(col.blocks),
          }));
          return { ...b, data: { ...b.data, columns: updatedColumns } };
        });

      const addToColumn = (blocks: Block[]): Block[] =>
        blocks.map((b) => {
          if (b.type !== 'columns' || !movedBlock) return b;
          if (b.id === targetParentId) {
            const updatedColumns = b.data.columns.map((col) => {
              if (col.id !== targetColumnId) return col;
              const newBlocks = [...col.blocks];
              if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newBlocks.length) {
                newBlocks.splice(targetIndex, 0, movedBlock);
              } else {
                newBlocks.push(movedBlock);
              }
              return { ...col, blocks: newBlocks };
            });
            return { ...b, data: { ...b.data, columns: updatedColumns } };
          }
          const updatedColumns = b.data.columns.map((col) => ({
            ...col,
            blocks: addToColumn(col.blocks),
          }));
          return { ...b, data: { ...b.data, columns: updatedColumns } };
        });

      let headerBlocks = removeFromColumn(state.template.header.blocks);
      let bodyBlocks = removeFromColumn(state.template.body.blocks);
      let footerBlocks = removeFromColumn(state.template.footer.blocks);

      if (movedBlock) {
        headerBlocks = addToColumn(headerBlocks);
        bodyBlocks = addToColumn(bodyBlocks);
        footerBlocks = addToColumn(footerBlocks);
      }

      return {
        template: {
          ...state.template,
          header: { blocks: headerBlocks },
          body: { blocks: bodyBlocks },
          footer: { blocks: footerBlocks },
        },
        isDirty: true,
      };
    });
  },

  setTiptapEditor: (editor) => set({ tiptapEditor: editor }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  duplicateBlock: (id) => {
    set((state) => {
      const header = duplicateBlockInList(state.template.header.blocks, id);
      const body = duplicateBlockInList(state.template.body.blocks, id);
      const footer = duplicateBlockInList(state.template.footer.blocks, id);
      const duplicatedId = header.duplicatedId || body.duplicatedId || footer.duplicatedId;

      if (!duplicatedId) return state;

      return {
        template: {
          ...state.template,
          header: { blocks: header.blocks },
          body: { blocks: body.blocks },
          footer: { blocks: footer.blocks },
        },
        isDirty: true,
        selectedBlockId: duplicatedId,
      };
    });
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

  applyOrganizationBackground: (backgroundStyle, backgroundColor) => {
    set((state) => {
      const current = state.template.settings;
      if (
        current.backgroundStyle === backgroundStyle
        && current.backgroundColor === backgroundColor
      ) {
        return state;
      }
      return {
        template: {
          ...state.template,
          settings: {
            ...state.template.settings,
            backgroundStyle: backgroundStyle || 'none',
            backgroundColor: backgroundColor || '#f4f4f4',
          },
        },
      };
    });
  },

  loadTemplate: (template) => set((state) => ({
    template: {
      ...template,
      settings: {
        ...DEFAULT_SETTINGS,
        ...template.settings,
        backgroundStyle: state.template.settings.backgroundStyle || 'none',
        backgroundColor: state.template.settings.backgroundColor || '#f4f4f4',
      },
    },
    isDirty: false,
    selectedBlockId: null,
  })),
  resetTemplate: () => set({ template: EMPTY_TEMPLATE, isDirty: false, selectedBlockId: null }),
  setActiveSection: (section) => set({ activeSection: section }),
  markClean: () => set({ isDirty: false }),

  getSelectedBlock: () => {
    const state = get();
    if (!state.selectedBlockId) return null;
    return (
      findBlockById(state.template.header.blocks, state.selectedBlockId)
      || findBlockById(state.template.body.blocks, state.selectedBlockId)
      || findBlockById(state.template.footer.blocks, state.selectedBlockId)
      || null
    );
  },

  getBodyBlocks: () => get().template.body.blocks,
}));
