const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('delete after upload: DELETE request, strikethrough, GET 404', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'deleteme.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('delete this file'),
  });

  // After upload completes, the cancel button becomes a delete button
  const uploadEl = page.locator('#uploads .upload').first();
  const deleteBtn = uploadEl.locator('.cancel').first();
  await deleteBtn.click();

  // Should get strikethrough
  await expect(uploadEl).toHaveClass(/strikethrough/, { timeout: 5000 });

  // File should be gone from server
  const resp = await page.request.get(href);
  expect(resp.status()).toBe(404);
});
