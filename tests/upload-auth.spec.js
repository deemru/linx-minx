const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('auth: HEAD /auth called before upload when data-auth=basic', async ({ page }) => {
  let headAuthCalled = false;

  // Intercept HEAD /auth
  await page.route('**/auth', async (route) => {
    if (route.request().method() === 'HEAD') {
      headAuthCalled = true;
      await route.fulfill({ status: 200 });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  // Set auth to basic and reset autoProcessQueue so auth check triggers
  await page.evaluate(() => {
    document.getElementById('dropzone').setAttribute('data-auth', 'basic');
    Dropzone.forElement('#dropzone').options.autoProcessQueue = false;
  });

  await uploadFiles(page, {
    name: 'authfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('auth test content'),
  });

  // Wait for upload to complete
  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 10000 });

  expect(headAuthCalled).toBe(true);
});
