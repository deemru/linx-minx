const { test, expect } = require('@playwright/test');
const { uploadFiles, uploadAndWaitForLink } = require('./helpers');

test('upload: empty file (0 bytes) shows error', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, {
    name: 'empty.txt',
    mimeType: 'text/plain',
    buffer: Buffer.alloc(0),
  });

  // Should show error, not a link
  const errorLabel = page.locator('#uploads .upload .error');
  await expect(errorLabel).toBeVisible({ timeout: 5000 });
});

test('upload: transliteration крипт→crypt special case', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, {
    name: 'криптография.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('translit test'),
  });

  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 10000 });
  const href = await link.getAttribute('href');

  // криптография → cryptografiya (крипт→crypt is special-cased)
  expect(href).toContain('crypt');
  expect(href).not.toContain('%'); // no URL encoding of cyrillic
});

test('upload: file with spaces in name', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'my file name.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('spaces test'),
  });

  expect(href).toContain('/f/');
  // Spaces should be converted to underscores by transliteration
  expect(href).toContain('my_file_name.txt');
});

test('upload: binary file preserves content', async ({ page }) => {
  await page.goto('/');

  // Create binary content with all byte values
  const buf = Buffer.alloc(256);
  for (let i = 0; i < 256; i++) buf[i] = i;

  const href = await uploadAndWaitForLink(page, {
    name: 'binary.bin',
    mimeType: 'application/octet-stream',
    buffer: buf,
  });

  const resp = await page.request.get(href.replace('/f/', '/d/'));
  expect(resp.status()).toBe(200);
  const body = await resp.body();
  expect(body.length).toBe(256);
  expect(Buffer.compare(body, buf)).toBe(0);
});
