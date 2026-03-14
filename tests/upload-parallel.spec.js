const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('parallel upload: 10 files, max 5 concurrent, all complete', async ({ page }) => {
  let maxConcurrent = 0;
  let currentActive = 0;

  // Intercept upload requests to track concurrency
  await page.route('**/upload', async (route) => {
    currentActive++;
    if (currentActive > maxConcurrent) maxConcurrent = currentActive;
    // Small delay to make concurrent uploads overlap
    await new Promise(r => setTimeout(r, 300));
    currentActive--;
    await route.continue();
  });

  await page.goto('/');

  const files = [];
  for (let i = 0; i < 10; i++) {
    files.push({
      name: 'parallel_' + i + '.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('content ' + i),
    });
  }

  await uploadFiles(page, files);

  // Wait for all 10 uploads to complete
  await expect(page.locator('#uploads .upload a')).toHaveCount(10, { timeout: 30000 });

  // At no point should more than 5 have been active
  expect(maxConcurrent).toBeLessThanOrEqual(5);
});
