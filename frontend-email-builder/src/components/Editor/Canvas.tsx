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
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useState } from 'react';
import type { BlockType } from '../../types/blocks';
import { createBlock } from '../../lib/blockFactory';
import { useEditorStore } from '../../store/editorStore';
import { BlockWrapper } from './BlockWrapper';
import { BlockRenderer } from './BlockRenderer';

export function Canvas() {
  const blocks = useEditorStore((s) => s.template.body.blocks);
  const addBlock = useEditorStore((s) => s.addBlock);
  const addBlockToColumn = useEditorStore((s) => s.addBlockToColumn);
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { isOver: isCanvasOver, setNodeRef: setCanvasDropRef } = useDroppable({
    id: 'canvas-drop',
    data: { dropType: 'canvas' },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
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

    if (over.data.current?.dropType === 'column') return;

    // Reordering existing blocks
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        moveBlock(oldIndex, newIndex);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  return (
    <div className="canvas-area" onClick={handleCanvasClick}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div ref={setCanvasDropRef} className={`canvas-container ${isCanvasOver ? 'canvas-drop-over' : ''}`}>
          {blocks.length === 0 ? (
            <div className="canvas-empty">
              Drag blocks here to start building your email
            </div>
          ) : (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block) => (
                <BlockWrapper key={block.id} block={block}>
                  <BlockRenderer block={block} />
                </BlockWrapper>
              ))}
            </SortableContext>
          )}
        </div>
        <DragOverlay>
          {activeId ? (
            <div style={{ opacity: 0.5, background: '#ebf4ff', padding: 16, borderRadius: 4, border: '2px solid #3182ce' }}>
              Moving block...
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
