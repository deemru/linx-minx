const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('max size: file over maxsize shows error, no upload', async ({ page }) => {
  let uploadCalled = false;

  await page.route('**/upload', async (route) => {
    uploadCalled = true;
    await route.continue();
  });

  await page.goto('/');

  // Get maxsize from form attribute (in bytes)
  const maxsizeStr = await page.locator('#dropzone').getAttribute('data-maxsize');
  const maxBytes = parseInt(maxsizeStr, 10);

  // Dropzone converts to MB: Math.round(maxBytes / 1024 / 1024)
  // So we need a file larger than that in MB. Create a small file but
  // override Dropzone's maxFilesize to something tiny for testing.
  await page.evaluate(() => {
    Dropzone.forElement('#dropzone').options.maxFilesize = 0.0001; // ~100 bytes
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
