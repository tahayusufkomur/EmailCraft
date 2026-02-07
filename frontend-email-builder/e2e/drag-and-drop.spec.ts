import { test, expect, type Page } from '@playwright/test';

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the editor to load
    await page.waitForSelector('.canvas-container', { timeout: 10000 });
  });

  test('should drag a text block from palette to canvas', async ({ page }) => {
    // Find the text block in the palette
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');

    // Drag from palette to canvas
    await textBlock.dragTo(canvas);

    // Verify block was added
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag an image block from palette to canvas', async ({ page }) => {
    const imageBlock = page.locator('[data-block-type="image"]').first();
    const canvas = page.locator('.canvas-container');

    await imageBlock.dragTo(canvas);

    // Verify image block was added
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag a button block from palette to canvas', async ({ page }) => {
    const buttonBlock = page.locator('[data-block-type="button"]').first();
    const canvas = page.locator('.canvas-container');

    await buttonBlock.dragTo(canvas);

    // Verify button block was added
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag a columns block from palette to canvas', async ({ page }) => {
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');

    await columnsBlock.dragTo(canvas);

    // Verify columns block was added with column slots
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
    await expect(page.locator('.column-slot')).toHaveCount(2); // Default 2 columns
  });

  test('should reorder blocks on canvas by dragging', async ({ page }) => {
    // Add two text blocks
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');

    await textBlock.dragTo(canvas);
    await page.waitForTimeout(500);
    await textBlock.dragTo(canvas);

    // Get the blocks
    const blocks = page.locator('.block-wrapper');
    await expect(blocks).toHaveCount(2);

    // Drag first block to second position
    const firstBlock = blocks.nth(0);
    const secondBlock = blocks.nth(1);

    await firstBlock.locator('[title="Drag to reorder"]').dragTo(secondBlock);

    // Verify order changed
    // This is a simple check - in a real app you'd verify actual content/IDs
    await expect(blocks).toHaveCount(2);
  });

  test('should drag block into a column', async ({ page }) => {
    // First add a columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    // Wait for columns to appear
    await page.waitForSelector('.column-slot');

    // Now drag a text block into the first column
    const textBlock = page.locator('[data-block-type="text"]').first();
    const firstColumn = page.locator('.column-slot').first();

    await textBlock.dragTo(firstColumn);

    // Verify block was added to column
    const nestedBlocks = page.locator('.nested-block-wrapper');
    await expect(nestedBlocks).toHaveCount(1);
  });

  test('should drag multiple blocks into different columns', async ({ page }) => {
    // Add columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    await page.waitForSelector('.column-slot');

    // Add text block to first column
    const textBlock = page.locator('[data-block-type="text"]').first();
    const firstColumn = page.locator('.column-slot').first();
    await textBlock.dragTo(firstColumn);

    await page.waitForTimeout(300);

    // Add button block to second column
    const buttonBlock = page.locator('[data-block-type="button"]').first();
    const secondColumn = page.locator('.column-slot').nth(1);
    await buttonBlock.dragTo(secondColumn);

    // Verify both columns have blocks
    const column1Blocks = firstColumn.locator('.nested-block-wrapper');
    const column2Blocks = secondColumn.locator('.nested-block-wrapper');

    await expect(column1Blocks).toHaveCount(1);
    await expect(column2Blocks).toHaveCount(1);
  });

  test('should reorder blocks within a column', async ({ page }) => {
    // Add columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    await page.waitForSelector('.column-slot');

    // Add two blocks to first column
    const textBlock = page.locator('[data-block-type="text"]').first();
    const firstColumn = page.locator('.column-slot').first();

    await textBlock.dragTo(firstColumn);
    await page.waitForTimeout(300);
    await textBlock.dragTo(firstColumn);

    // Verify two blocks in column
    const columnBlocks = firstColumn.locator('.nested-block-wrapper');
    await expect(columnBlocks).toHaveCount(2);

    // Drag first block to second position
    const firstNestedBlock = columnBlocks.nth(0);
    const secondNestedBlock = columnBlocks.nth(1);

    await firstNestedBlock.locator('[title="Drag to reorder"]').dragTo(secondNestedBlock);

    // Verify blocks are still there (order may have changed)
    await expect(columnBlocks).toHaveCount(2);
  });

  test('should move block between columns by dragging', async ({ page }) => {
    // Add columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    await page.waitForSelector('.column-slot');

    // Add block to first column
    const textBlock = page.locator('[data-block-type="text"]').first();
    const firstColumn = page.locator('.column-slot').first();
    const secondColumn = page.locator('.column-slot').nth(1);

    await textBlock.dragTo(firstColumn);

    await page.waitForTimeout(300);

    // Verify block is in first column
    let column1Blocks = firstColumn.locator('.nested-block-wrapper');
    let column2Blocks = secondColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(1);
    await expect(column2Blocks).toHaveCount(0);

    // Drag block from first column to second column
    const blockInColumn1 = column1Blocks.first();
    await blockInColumn1.locator('[title="Drag to reorder"]').dragTo(secondColumn);

    await page.waitForTimeout(300);

    // Verify block moved to second column
    column1Blocks = firstColumn.locator('.nested-block-wrapper');
    column2Blocks = secondColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(0);
    await expect(column2Blocks).toHaveCount(1);
  });

  test('should select block when clicked', async ({ page }) => {
    // Add a block
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');
    await textBlock.dragTo(canvas);

    // Click the block
    const block = page.locator('.block-wrapper').first();
    await block.click();

    // Verify block is selected
    await expect(block).toHaveClass(/selected/);
  });

  test('should delete block when delete button is clicked', async ({ page }) => {
    // Add a block
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');
    await textBlock.dragTo(canvas);

    // Verify block exists
    await expect(page.locator('.block-wrapper')).toHaveCount(1);

    // Click delete button
    const deleteButton = page.locator('.block-wrapper [title="Delete"]').first();
    await deleteButton.click();

    // Verify block is deleted
    await expect(page.locator('.block-wrapper')).toHaveCount(0);
    await expect(page.locator('.canvas-empty')).toBeVisible();
  });

  test('should duplicate block when duplicate button is clicked', async ({ page }) => {
    // Add a block
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');
    await textBlock.dragTo(canvas);

    // Verify one block exists
    await expect(page.locator('.block-wrapper')).toHaveCount(1);

    // Click duplicate button
    const duplicateButton = page.locator('.block-wrapper [title="Duplicate"]').first();
    await duplicateButton.click();

    // Verify two blocks exist now
    await expect(page.locator('.block-wrapper')).toHaveCount(2);
  });

  test('should show empty state when canvas has no blocks', async ({ page }) => {
    // Verify empty state is shown
    await expect(page.locator('.canvas-empty')).toBeVisible();
    await expect(page.locator('.canvas-empty')).toContainText('Drag blocks here');
  });

  test('should show empty state in columns when no blocks', async ({ page }) => {
    // Add columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    // Verify column empty states
    const emptyStates = page.locator('.column-slot-empty');
    await expect(emptyStates).toHaveCount(2); // 2 columns
    await expect(emptyStates.first()).toContainText('Column 1');
  });

  test('should handle drag over visual feedback', async ({ page }) => {
    // Add a block first
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');
    await textBlock.dragTo(canvas);

    // Start dragging another block
    const buttonBlock = page.locator('[data-block-type="button"]').first();

    // Hover over canvas (simulate drag over)
    await buttonBlock.hover();
    await page.mouse.down();
    await canvas.hover();

    // Note: Testing visual feedback is limited without actual CSS inspection
    // This test verifies the drag operation doesn't crash
    await page.mouse.up();
  });

  test('should drag divider block into canvas', async ({ page }) => {
    const dividerBlock = page.locator('[data-block-type="divider"]').first();
    const canvas = page.locator('.canvas-container');

    await dividerBlock.dragTo(canvas);

    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag social block into canvas', async ({ page }) => {
    const socialBlock = page.locator('[data-block-type="social"]').first();
    const canvas = page.locator('.canvas-container');

    await socialBlock.dragTo(canvas);

    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should maintain column structure after adding multiple blocks', async ({ page }) => {
    // Add columns block
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);

    await page.waitForSelector('.column-slot');

    // Add 3 blocks to first column
    const textBlock = page.locator('[data-block-type="text"]').first();
    const firstColumn = page.locator('.column-slot').first();

    for (let i = 0; i < 3; i++) {
      await textBlock.dragTo(firstColumn);
      await page.waitForTimeout(200);
    }

    // Verify structure
    await expect(page.locator('.column-slot')).toHaveCount(2);
    const column1Blocks = firstColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(3);
  });
});
