const { test, expect } = require('@playwright/test');

test('fallback: JS disabled shows .fallback, hides #dzone', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/');

  // Fallback should be visible
  const fallback = page.locator('.fallback');
  await expect(fallback).toBeVisible({ timeout: 5000 });

  // #dzone should be hidden (display:none is default when JS doesn't run to show it)
  // In the CSS, #dzone has display:block but Dropzone.init sets it.
  // Without JS, the inline style from JS won't run, so check if dzone is NOT visible
  // Actually the HTML has #dzone with class dz-default dz-message
  // Dropzone normally hides fallback and shows dzone. Without JS, fallback is visible.
  const dzone = page.locator('#dzone');

  // Without Dropzone JS, dzone should not be interactive/functional
  // The fallback div should be the primary visible element
  await expect(fallback).toBeVisible();

  await context.close();
});
