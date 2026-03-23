import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState, type ReactNode } from 'react';
import type { BlockType, Block } from '../../types/blocks';
import { createBlock } from '../../lib/blockFactory';
import { useEditorStore } from '../../store/editorStore';

interface Props {
  children: ReactNode;
}

export function EditorDndContext({ children }: Props) {
  const blocks = useEditorStore((s) => s.template.body.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const addBlockToColumn = useEditorStore((s) => s.addBlockToColumn);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const moveBlockWithinColumn = useEditorStore((s) => s.moveBlockWithinColumn);
  const moveBlockBetweenColumns = useEditorStore((s) => s.moveBlockBetweenColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState<Block | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);

    // If dragging from palette, create a temporary block for the overlay
    if (event.active.data.current?.fromPalette) {
      const blockType = event.active.data.current.blockType as BlockType;
      const tempBlock = createBlock(blockType);
      setActiveBlock(tempBlock);
    }
  };

  const collisionDetection: CollisionDetection = (args) => {
    if (args.active.data.current?.fromPalette) {
      const pointerCollisions = pointerWithin(args);
      const columnPointerCollision = pointerCollisions.find((collision) => {
        const container = args.droppableContainers.find((droppable) => droppable.id === collision.id);
        return container?.data.current?.dropType === 'column';
      });
      if (columnPointerCollision) {
        return [columnPointerCollision];
      }

      const rectCollisions = rectIntersection(args);
      const columnRectCollision = rectCollisions.find((collision) => {
        const container = args.droppableContainers.find((droppable) => droppable.id === collision.id);
        return container?.data.current?.dropType === 'column';
      });
      if (columnRectCollision) {
        return [columnRectCollision];
      }
    }

    return closestCenter(args);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setActiveBlock(null);
    const { active, over } = event;

    if (!over) return;

    // Dragging from palette (new block)
    if (active.data.current?.fromPalette) {
      const blockType = active.data.current.blockType as BlockType;
      const newBlock = createBlock(blockType);
      const overData = over.data.current;

      if (overData?.dropType === 'column') {
        const parentBlockId = overData.parentBlockId as string;
        const columnId = overData.columnId as string;
        addBlockToColumn(parentBlockId, columnId, newBlock);
        return;
      }

      if (overData?.dropType === 'canvas') {
        addBlock(newBlock);
        return;
      }

      const overIndex = blocks.findIndex((b) => b.id === over.id);
      addBlock(newBlock, overIndex >= 0 ? overIndex : undefined);
      return;
    }

    // Dragging nested blocks
    if (active.data.current?.type === 'nested-block') {
      const activeData = active.data.current;
      const overData = over.data.current;

      // Dragging to a column
      if (overData?.dropType === 'column') {
        const sourceParentId = activeData.parentBlockId as string;
        const sourceColumnId = activeData.columnId as string;
        const targetParentId = overData.parentBlockId as string;
        const targetColumnId = overData.columnId as string;

        // Same column - ignore (handled by sortable)
        if (sourceParentId === targetParentId && sourceColumnId === targetColumnId) {
          return;
        }

        // Different column - move between columns
        moveBlockBetweenColumns(
          active.id as string,
          sourceParentId,
          sourceColumnId,
          targetParentId,
          targetColumnId
        );
        return;
      }

      // Dragging to another nested block (reordering within column)
      if (overData?.type === 'nested-block') {
        const sourceParentId = activeData.parentBlockId as string;
        const sourceColumnId = activeData.columnId as string;
        const targetParentId = overData.parentBlockId as string;
        const targetColumnId = overData.columnId as string;

        // Same column - reorder
        if (sourceParentId === targetParentId && sourceColumnId === targetColumnId) {
          // Find the column to get blocks
          const parentBlock = blocks.find((b) => b.id === sourceParentId);
          if (parentBlock && parentBlock.type === 'columns') {
            const column = parentBlock.data.columns.find((c) => c.id === sourceColumnId);
            if (column) {
              const oldIndex = column.blocks.findIndex((b) => b.id === active.id);
              const newIndex = column.blocks.findIndex((b) => b.id === over.id);
              if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                moveBlockWithinColumn(sourceParentId, sourceColumnId, oldIndex, newIndex);
              }
            }
          }
        } else {
          // Different columns - move between
          const parentBlock = blocks.find((b) => b.id === targetParentId);
          if (parentBlock && parentBlock.type === 'columns') {
            const targetColumn = parentBlock.data.columns.find((c) => c.id === targetColumnId);
            if (targetColumn) {
              const targetIndex = targetColumn.blocks.findIndex((b) => b.id === over.id);
              moveBlockBetweenColumns(
                active.id as string,
                sourceParentId,
                sourceColumnId,
                targetParentId,
                targetColumnId,
                targetIndex >= 0 ? targetIndex : undefined
              );
            }
          }
        }
        return;
      }
    }

    // Reordering existing blocks in canvas
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveBlock(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeId && activeBlock ? (
          <div
            style={{
              opacity: 0.8,
              background: '#ebf4ff',
              padding: '16px',
              borderRadius: '8px',
              border: '2px dashed #3182ce',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 500,
              color: '#2c5282',
              cursor: 'grabbing',
            }}
          >
            {activeBlock.type === 'text' && '📝 Text Block'}
            {activeBlock.type === 'heading' && '📰 Heading Block'}
            {activeBlock.type === 'image' && '🖼️ Image Block'}
            {activeBlock.type === 'button' && '🔘 Button Block'}
            {activeBlock.type === 'divider' && '➖ Divider Block'}
            {activeBlock.type === 'spacer' && '↕️ Spacer Block'}
            {activeBlock.type === 'columns' && '📊 Columns Block'}
            {activeBlock.type === 'social' && '🌐 Social Block'}
            {activeBlock.type === 'html' && '💻 HTML Block'}
          </div>
        ) : activeId ? (
          <div
            style={{
              opacity: 0.5,
              background: '#ebf4ff',
              padding: 16,
              borderRadius: 4,
              border: '2px solid #3182ce',
            }}
          >
            Moving block...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
