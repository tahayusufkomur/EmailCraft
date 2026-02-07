import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
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
  const moveBlock = useEditorStore((s) => s.moveBlock);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    // Dragging from palette (new block)
    if (active.data.current?.fromPalette) {
      const blockType = active.data.current.blockType as BlockType;
      const newBlock = createBlock(blockType);
      const overIndex = blocks.findIndex((b) => b.id === over.id);
      addBlock(newBlock, overIndex >= 0 ? overIndex : undefined);
      return;
    }

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
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="canvas-container">
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
