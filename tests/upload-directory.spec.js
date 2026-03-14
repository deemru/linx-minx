const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('directory upload: 3 files from directory all uploaded', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, [
    { name: 'dir_file1.txt', mimeType: 'text/plain', buffer: Buffer.from('file1 content') },
    { name: 'dir_file2.txt', mimeType: 'text/plain', buffer: Buffer.from('file2 content') },
    { name: 'dir_file3.txt', mimeType: 'text/plain', buffer: Buffer.from('file3 content') },
  ]);

  // Wait for all 3 uploads to complete (links visible)
  await expect(page.locator('#uploads .upload a')).toHaveCount(3, { timeout: 15000 });
});
