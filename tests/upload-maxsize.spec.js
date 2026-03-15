const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('max size: file over maxsize shows error, no upload', async ({ page }) => {
  let uploadCalled = false;

  await page.route('**/upload', async (route) => {
    uploadCalled = true;
    await route.continue();
  });

  await page.goto('/');

  // Set maxFilesize to something tiny via engine
  // The engine reads maxFilesize from config, but we can override via evaluate
  await page.evaluate(() => {
    engine.maxFilesize = 100; // 100 bytes
  });

  await uploadFiles(page, {
    name: 'toobig.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'.repeat(1000)),
  });

  // Should see an upload element with error
  const uploadEl = page.locator('#uploads .upload').first();
  await expect(uploadEl).toBeVisible({ timeout: 5000 });

  // Should have error class on the label
  const errorLabel = uploadEl.locator('.error');
  await expect(errorLabel).toBeVisible({ timeout: 5000 });

  // No XHR should have been sent
  expect(uploadCalled).toBe(false);
});
