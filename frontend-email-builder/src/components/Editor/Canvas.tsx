import { useDroppable, useDndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEditorStore } from '../../store/editorStore';
import { BlockWrapper } from './BlockWrapper';
import { BlockRenderer } from './BlockRenderer';

export function Canvas() {
  const blocks = useEditorStore((s) => s.template.body.blocks);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const { active, over } = useDndContext();
  const { isOver: isCanvasOver, setNodeRef: setCanvasDropRef } = useDroppable({
    id: 'canvas-drop',
    data: { dropType: 'canvas' },
  });

  // Check if dragging from palette and hovering over canvas or last block (for bottom drop zone)
  const isDraggingFromPalette = active?.data.current?.fromPalette;
  const isOverCanvas = over?.id === 'canvas-drop';
  const lastBlockId = blocks.length > 0 ? blocks[blocks.length - 1].id : null;
  const isOverLastBlock = over?.id === lastBlockId;
  const showBottomIndicator = isDraggingFromPalette && (isOverCanvas || isOverLastBlock) && blocks.length > 0;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  return (
    <div className="canvas-area" onClick={handleCanvasClick}>
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
            {showBottomIndicator && (
              <div className="canvas-bottom-drop-zone">
                <div className="canvas-bottom-indicator">
                  Drop here to add to bottom
                </div>
              </div>
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
}
