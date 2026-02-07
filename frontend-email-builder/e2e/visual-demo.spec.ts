import { test, expect } from '@playwright/test';

/**
 * Visual demo test - demonstrates the drag & drop functionality
 * Run with: npm run test:e2e:headed
 * or: npx playwright test e2e/visual-demo.spec.ts --headed --slow-mo=1000
 */
test.describe('Visual Demo - Drag and Drop', () => {
  test('complete email building workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-container');

    // Step 1: Add a heading
    console.log('Step 1: Adding heading block...');
    const headingBlock = page.locator('[data-block-type="heading"]').first();
    const canvas = page.locator('.canvas-container');
    await headingBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Step 2: Add a text block
    console.log('Step 2: Adding text block...');
    const textBlock = page.locator('[data-block-type="text"]').first();
    await textBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Step 3: Add a columns block
    console.log('Step 3: Adding columns block...');
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    await columnsBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Verify columns appeared
    await expect(page.locator('.column-slot')).toHaveCount(2);

    // Step 4: Add image to first column
    console.log('Step 4: Adding image to first column...');
    const imageBlock = page.locator('[data-block-type="image"]').first();
    const firstColumn = page.locator('.column-slot').first();
    await imageBlock.dragTo(firstColumn);
    await page.waitForTimeout(500);

    // Step 5: Add button to second column
    console.log('Step 5: Adding button to second column...');
    const buttonBlock = page.locator('[data-block-type="button"]').first();
    const secondColumn = page.locator('.column-slot').nth(1);
    await buttonBlock.dragTo(secondColumn);
    await page.waitForTimeout(500);

    // Step 6: Add text to first column
    console.log('Step 6: Adding another text block to first column...');
    await textBlock.dragTo(firstColumn);
    await page.waitForTimeout(500);

    // Step 7: Add a divider
    console.log('Step 7: Adding divider below columns...');
    const dividerBlock = page.locator('[data-block-type="divider"]').first();
    await dividerBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Step 8: Add social icons
    console.log('Step 8: Adding social block...');
    const socialBlock = page.locator('[data-block-type="social"]').first();
    await socialBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Verify final structure
    console.log('Verifying final structure...');
    const blocks = page.locator('.block-wrapper');
    await expect(blocks).toHaveCount(5); // heading, text, columns, divider, social

    const column1Blocks = firstColumn.locator('.nested-block-wrapper');
    const column2Blocks = secondColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(2); // image + text
    await expect(column2Blocks).toHaveCount(1); // button

    console.log('Demo complete! Email template built successfully.');

    // Take a final screenshot
    await page.screenshot({
      path: 'e2e/screenshots/demo-complete.png',
      fullPage: true,
    });
  });

  test('demonstrate reordering and moving between columns', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-container');

    // Setup: Create columns with multiple blocks
    console.log('Setting up columns...');
    const columnsBlock = page.locator('[data-block-type="columns"]').first();
    const canvas = page.locator('.canvas-container');
    await columnsBlock.dragTo(canvas);
    await page.waitForTimeout(300);

    const firstColumn = page.locator('.column-slot').first();
    const secondColumn = page.locator('.column-slot').nth(1);

    // Add 2 text blocks to first column
    console.log('Adding blocks to first column...');
    const textBlock = page.locator('[data-block-type="text"]').first();
    await textBlock.dragTo(firstColumn);
    await page.waitForTimeout(300);
    await textBlock.dragTo(firstColumn);
    await page.waitForTimeout(300);

    // Add 1 button to second column
    console.log('Adding button to second column...');
    const buttonBlock = page.locator('[data-block-type="button"]').first();
    await buttonBlock.dragTo(secondColumn);
    await page.waitForTimeout(300);

    // Take before screenshot
    await page.screenshot({
      path: 'e2e/screenshots/before-move.png',
      fullPage: true,
    });

    // Demonstrate moving block from column 1 to column 2
    console.log('Moving block from column 1 to column 2...');
    const blockToMove = firstColumn.locator('.nested-block-wrapper').first();
    await blockToMove.locator('[title="Drag to reorder"]').dragTo(secondColumn);
    await page.waitForTimeout(500);

    // Verify the move
    const column1Blocks = firstColumn.locator('.nested-block-wrapper');
    const column2Blocks = secondColumn.locator('.nested-block-wrapper');
    await expect(column1Blocks).toHaveCount(1);
    await expect(column2Blocks).toHaveCount(2);

    // Take after screenshot
    await page.screenshot({
      path: 'e2e/screenshots/after-move.png',
      fullPage: true,
    });

    console.log('Move demonstration complete!');
  });

  test('demonstrate block operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-container');

    // Add a block
    console.log('Adding a text block...');
    const textBlock = page.locator('[data-block-type="text"]').first();
    const canvas = page.locator('.canvas-container');
    await textBlock.dragTo(canvas);
    await page.waitForTimeout(500);

    // Demonstrate selection
    console.log('Clicking to select block...');
    const block = page.locator('.block-wrapper').first();
    await block.click();
    await expect(block).toHaveClass(/selected/);
    await page.waitForTimeout(500);

    // Demonstrate duplicate
    console.log('Duplicating block...');
    const duplicateBtn = block.locator('[title="Duplicate"]');
    await duplicateBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.block-wrapper')).toHaveCount(2);

    // Take screenshot
    await page.screenshot({
      path: 'e2e/screenshots/duplicated.png',
      fullPage: true,
    });

    // Demonstrate delete
    console.log('Deleting a block...');
    const deleteBtn = page.locator('.block-wrapper').first().locator('[title="Delete"]');
    await deleteBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('.block-wrapper')).toHaveCount(1);

    console.log('Block operations demonstration complete!');
  });
});
