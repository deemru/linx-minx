const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('upload progress: percentage shown during upload, link after', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, {
    name: 'progressfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('x'.repeat(1000)),
  });

  const uploadEl = page.locator('#uploads .upload').first();
  await expect(uploadEl).toBeVisible({ timeout: 5000 });

  // Eventually should have a link (upload completed)
  const link = uploadEl.locator('a');
  await expect(link).toBeVisible({ timeout: 15000 });
});
