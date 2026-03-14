const { test, expect } = require('@playwright/test');

test('paste upload: paste image triggers upload', async ({ page }) => {
  await page.goto('/');

  // Create a small PNG blob and dispatch paste event
  await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 10, 10);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'pasted.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
    });
    document.dispatchEvent(pasteEvent);
  });

  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 10000 });
});
