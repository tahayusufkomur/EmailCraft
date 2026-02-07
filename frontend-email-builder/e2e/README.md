# E2E Tests for Email Builder

This directory contains end-to-end tests for the email builder drag & drop functionality using Playwright.

## Setup

The tests are already configured and ready to run. Playwright is installed as a dev dependency.

## Running Tests

```bash
# Run all tests (headless mode)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (watch the browser)
npm run test:e2e:headed

# Run tests in debug mode (step through)
npm run test:e2e:debug

# Run a specific test file
npx playwright test e2e/drag-and-drop.spec.ts

# Run tests matching a pattern
npx playwright test --grep "drag.*column"
```

## Test Coverage

The `drag-and-drop.spec.ts` file covers:

### Basic Drag & Drop
- ✅ Dragging blocks from palette to canvas (text, image, button, columns, divider, social)
- ✅ Reordering blocks on canvas
- ✅ Visual feedback during drag operations

### Column Functionality
- ✅ Dragging blocks into columns
- ✅ Dragging blocks into different columns
- ✅ Reordering blocks within a single column
- ✅ Moving blocks between different columns
- ✅ Maintaining column structure with multiple blocks

### Block Operations
- ✅ Selecting blocks by clicking
- ✅ Deleting blocks
- ✅ Duplicating blocks

### UI States
- ✅ Empty canvas state
- ✅ Empty column states
- ✅ Drag over visual feedback

## Writing New Tests

To add a new test:

1. Open `e2e/drag-and-drop.spec.ts` or create a new spec file
2. Use the Playwright Test API:

```typescript
test('my new test', async ({ page }) => {
  await page.goto('/');
  // Your test code here
});
```

3. Use data attributes to select elements:
   - `[data-block-type="text"]` - palette items
   - `.canvas-container` - main canvas
   - `.column-slot` - column drop zones
   - `.block-wrapper` - blocks on canvas
   - `.nested-block-wrapper` - blocks inside columns

## Debugging Tests

If a test fails:

1. Run in headed mode to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

2. Use debug mode to step through:
   ```bash
   npm run test:e2e:debug
   ```

3. Check the HTML report after failures:
   ```bash
   npx playwright show-report
   ```

4. Add screenshots for debugging:
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

## CI/CD Integration

The tests can be integrated into your CI pipeline. The configuration in `playwright.config.ts` already includes CI-specific settings:

- Retries on failure in CI mode
- Single worker in CI to avoid flakiness
- Automatic server startup

Set `CI=true` environment variable to enable CI mode.

## Browser Support

Currently configured to test only on Chromium. To add more browsers, edit `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
],
```

## Troubleshooting

**Tests timeout**: Increase the timeout in `playwright.config.ts` or add `{ timeout: 60000 }` to specific tests.

**Elements not found**: Make sure the dev server is running and accessible at `http://localhost:5173`.

**Flaky tests**: Add explicit waits using `await page.waitForTimeout(ms)` or `await page.waitForSelector(selector)`.
