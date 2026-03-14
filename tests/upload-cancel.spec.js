const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('cancel upload: click cancel during upload aborts, strikethrough', async ({ page }) => {
  // Delay upload response so we have time to click cancel
  await page.route('**/upload', async (route) => {
    await new Promise(r => setTimeout(r, 5000));
    await route.continue();
  });

  await page.goto('/');

  await uploadFiles(page, {
    name: 'cancelme.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('cancel this upload'),
  });

  const uploadEl = page.locator('#uploads .upload').first();
  await expect(uploadEl).toBeVisible({ timeout: 5000 });

  // Click cancel button
  const cancelBtn = uploadEl.locator('.cancel').first();
  await cancelBtn.click();

  // Should get strikethrough class
  await expect(uploadEl).toHaveClass(/strikethrough/, { timeout: 5000 });
});
