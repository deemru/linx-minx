const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('storage: localStorage has entry after upload, persists on reload', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, {
    name: 'storagefile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('storage test content'),
  });

  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 10000 });

  // Check localStorage
  const stored = await page.evaluate(() => localStorage.getItem('linx-minx-files'));
  expect(stored).toBeTruthy();
  const files = JSON.parse(stored);
  expect(files.length).toBeGreaterThanOrEqual(1);
  expect(files[0].furl).toBeTruthy();

  // Reload and verify file is still displayed from storage
  await page.reload();
  await page.waitForLoadState('networkidle');

  const reloadedLink = page.locator('#uploads .upload a').first();
  await expect(reloadedLink).toBeVisible({ timeout: 5000 });
});
