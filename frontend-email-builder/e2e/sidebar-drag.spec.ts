import { test, expect } from '@playwright/test';

/**
 * Tests for dragging blocks from the left sidebar (BlockPalette) into the template
 */
test.describe('Sidebar to Template Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-container', { timeout: 10000 });
    await page.waitForSelector('.palette-grid', { timeout: 10000 });
  });

  test('should show BlockPalette sidebar with all block types', async ({ page }) => {
    // Verify sidebar is visible
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.sidebar-header')).toContainText('Blocks');

    // Verify all block types are present
    const blockTypes = [
      'heading', 'text', 'image', 'button',
      'spacer', 'divider', 'columns', 'social', 'html'
    ];

    for (const type of blockTypes) {
      await expect(page.locator(`[data-block-type="${type}"]`)).toBeVisible();
    }
  });

  test('should drag heading block from sidebar to canvas', async ({ page }) => {
    const headingBlock = page.locator('[data-block-type="heading"]');
    const canvas = page.locator('.canvas-container');

    // Verify canvas is initially empty
    await expect(page.locator('.canvas-empty')).toBeVisible();

    // Drag from sidebar to canvas
    await headingBlock.dragTo(canvas);

    // Verify block was added
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
    await expect(page.locator('.canvas-empty')).not.toBeVisible();
  });

  test('should drag text block from sidebar to canvas', async ({ page }) => {
    const textBlock = page.locator('[data-block-type="text"]');
    const canvas = page.locator('.canvas-container');

    await textBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag image block from sidebar to canvas', async ({ page }) => {
    const imageBlock = page.locator('[data-block-type="image"]');
    const canvas = page.locator('.canvas-container');

    await imageBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag button block from sidebar to canvas', async ({ page }) => {
    const buttonBlock = page.locator('[data-block-type="button"]');
    const canvas = page.locator('.canvas-container');

    await buttonBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag spacer block from sidebar to canvas', async ({ page }) => {
    const spacerBlock = page.locator('[data-block-type="spacer"]');
    const canvas = page.locator('.canvas-container');

    await spacerBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag divider block from sidebar to canvas', async ({ page }) => {
    const dividerBlock = page.locator('[data-block-type="divider"]');
    const canvas = page.locator('.canvas-container');

    await dividerBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag columns block from sidebar to canvas', async ({ page }) => {
    const columnsBlock = page.locator('[data-block-type="columns"]');
    const canvas = page.locator('.canvas-container');

    await columnsBlock.dragTo(canvas);

    // Verify columns block was added with 2 columns
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
    await expect(page.locator('.column-slot')).toHaveCount(2);
  });

  test('should drag social block from sidebar to canvas', async ({ page }) => {
    const socialBlock = page.locator('[data-block-type="social"]');
    const canvas = page.locator('.canvas-container');

    await socialBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag html block from sidebar to canvas', async ({ page }) => {
    const htmlBlock = page.locator('[data-block-type="html"]');
    const canvas = page.locator('.canvas-container');

    await htmlBlock.dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag multiple different blocks from sidebar sequentially', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Add heading
    await page.locator('[data-block-type="heading"]').dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);

    // Add text
    await page.locator('[data-block-type="text"]').dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(2);

    // Add button
    await page.locator('[data-block-type="button"]').dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(3);

    // Add divider
    await page.locator('[data-block-type="divider"]').dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(4);
  });

  test('should drag block from sidebar directly into a column', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // First add a columns block
    await page.locator('[data-block-type="columns"]').dragTo(canvas);
    await page.waitForSelector('.column-slot');

    // Now drag text block from sidebar into first column
    const textBlock = page.locator('[data-block-type="text"]');
    const firstColumn = page.locator('.column-slot').first();

    await textBlock.dragTo(firstColumn);

    // Verify block was added to column
    const nestedBlocks = firstColumn.locator('.nested-block-wrapper');
    await expect(nestedBlocks).toHaveCount(1);
  });

  test('should drag multiple blocks from sidebar into different columns', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Add columns block
    await page.locator('[data-block-type="columns"]').dragTo(canvas);
    await page.waitForSelector('.column-slot');

    const firstColumn = page.locator('.column-slot').first();
    const secondColumn = page.locator('.column-slot').nth(1);

    // Drag text into first column
    await page.locator('[data-block-type="text"]').dragTo(firstColumn);
    await page.waitForTimeout(300);

    // Drag button into second column
    await page.locator('[data-block-type="button"]').dragTo(secondColumn);
    await page.waitForTimeout(300);

    // Drag image into first column again
    await page.locator('[data-block-type="image"]').dragTo(firstColumn);

    // Verify distribution
    await expect(firstColumn.locator('.nested-block-wrapper')).toHaveCount(2);
    await expect(secondColumn.locator('.nested-block-wrapper')).toHaveCount(1);
  });

  test('should show visual feedback when dragging from sidebar', async ({ page }) => {
    const textBlock = page.locator('[data-block-type="text"]');
    const canvas = page.locator('.canvas-container');

    // Start dragging
    await textBlock.hover();
    await page.mouse.down();

    // Block should have reduced opacity while dragging
    const opacity = await textBlock.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(opacity)).toBeLessThan(1);

    // Complete drag
    await canvas.hover();
    await page.mouse.up();
  });

  test('should add block to canvas when clicking sidebar item (alternative to drag)', async ({ page }) => {
    // The palette items also support click to add
    const textBlock = page.locator('[data-block-type="text"]');

    // Click instead of drag
    await textBlock.click();

    // Block should be added
    await expect(page.locator('.block-wrapper')).toHaveCount(1);
  });

  test('should drag block from sidebar to specific position between existing blocks', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Add first block
    await page.locator('[data-block-type="heading"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // Add second block
    await page.locator('[data-block-type="divider"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // Verify we have 2 blocks
    await expect(page.locator('.block-wrapper')).toHaveCount(2);

    // Now drag a text block from sidebar and drop it between them
    const textBlock = page.locator('[data-block-type="text"]');
    const firstBlock = page.locator('.block-wrapper').first();

    await textBlock.dragTo(firstBlock);
    await page.waitForTimeout(200);

    // Should now have 3 blocks
    await expect(page.locator('.block-wrapper')).toHaveCount(3);
  });

  test('should handle rapid dragging from sidebar', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Rapidly drag 5 blocks
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-block-type="text"]').dragTo(canvas);
      await page.waitForTimeout(100);
    }

    // Should have 5 blocks
    await expect(page.locator('.block-wrapper')).toHaveCount(5);
  });

  test('should maintain sidebar visibility after dragging blocks', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Drag several blocks
    await page.locator('[data-block-type="text"]').dragTo(canvas);
    await page.locator('[data-block-type="button"]').dragTo(canvas);

    // Sidebar should still be visible and functional
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.palette-grid')).toBeVisible();

    // Should still be able to drag more blocks
    await page.locator('[data-block-type="image"]').dragTo(canvas);
    await expect(page.locator('.block-wrapper')).toHaveCount(3);
  });

  test('should build complete email template from sidebar', async ({ page }) => {
    const canvas = page.locator('.canvas-container');

    // Build a complete template structure
    // 1. Header
    await page.locator('[data-block-type="heading"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // 2. Intro text
    await page.locator('[data-block-type="text"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // 3. Image
    await page.locator('[data-block-type="image"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // 4. Columns with content
    await page.locator('[data-block-type="columns"]').dragTo(canvas);
    await page.waitForTimeout(200);

    const firstColumn = page.locator('.column-slot').first();
    const secondColumn = page.locator('.column-slot').nth(1);

    await page.locator('[data-block-type="text"]').dragTo(firstColumn);
    await page.waitForTimeout(200);
    await page.locator('[data-block-type="button"]').dragTo(secondColumn);
    await page.waitForTimeout(200);

    // 5. Divider
    await page.locator('[data-block-type="divider"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // 6. Social
    await page.locator('[data-block-type="social"]').dragTo(canvas);
    await page.waitForTimeout(200);

    // Verify complete structure
    const canvasBlocks = page.locator('.canvas-container > .block-wrapper');
    await expect(canvasBlocks).toHaveCount(6);

    const column1Blocks = firstColumn.locator('.nested-block-wrapper');
    const column2Blocks = secondColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(1);
    await expect(column2Blocks).toHaveCount(1);
  });
});
