const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('click upload: click #dzone opens file chooser, file uploaded', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'clickfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('click upload content'),
  });

  expect(href).toBeTruthy();
});
