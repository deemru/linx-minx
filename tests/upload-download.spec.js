const { test, expect } = require('@playwright/test');
const crypto = require('crypto');
const { uploadAndWaitForLink } = require('./helpers');

test('download: uploaded binary file matches byte-for-byte', async ({ page }) => {
  await page.goto('/');

  // Generate 100 random bytes
  const randomBytes = crypto.randomBytes(100);

  const href = await uploadAndWaitForLink(page, {
    name: 'binary.bin',
    mimeType: 'application/octet-stream',
    buffer: randomBytes,
  });

  // furl is /f/<key>/<name> (display page), raw download is /d/<key>/<name>
  const downloadUrl = href.replace('/f/', '/d/');
  const resp = await page.request.get(downloadUrl);
  expect(resp.status()).toBe(200);

  const downloaded = Buffer.from(await resp.body());
  expect(downloaded.equals(randomBytes)).toBe(true);
});
