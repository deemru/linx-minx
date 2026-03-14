const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('display page: /f/ shows file info with download and copy buttons', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'viewme.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('display page test'),
  });

  // Navigate to the display page (/f/key/filename)
  await page.goto(href);

  // Should have download button
  const downloadBtn = page.locator('.download-btn');
  await expect(downloadBtn).toBeVisible({ timeout: 5000 });

  // Should have copy button
  const copyBtn = page.locator('.copy-btn');
  await expect(copyBtn).toBeVisible({ timeout: 5000 });

  // Should show the filename somewhere
  await expect(page.locator('body')).toContainText('viewme.txt');
});
