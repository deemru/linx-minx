const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('drag-drop upload: file appears in #uploads, link works', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'testfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello drag drop'),
  });

  expect(href).toBeTruthy();
  const resp = await page.request.get(href);
  expect(resp.status()).toBe(200);
});
