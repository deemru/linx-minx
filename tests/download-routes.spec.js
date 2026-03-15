const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('/d/ route returns raw file with content-disposition attachment', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'rawfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('raw download test'),
  });

  // /f/ → /d/ for raw download
  const downloadUrl = href.replace('/f/', '/d/');
  const resp = await page.request.get(downloadUrl);
  expect(resp.status()).toBe(200);

  const disposition = resp.headers()['content-disposition'] || '';
  expect(disposition).toContain('attachment');
  expect(disposition).toContain('rawfile.txt');
});

test('/v/ route returns file inline', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'inlinefile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('inline view test'),
  });

  // /f/ → /v/ for inline view
  const viewUrl = href.replace('/f/', '/v/');
  const resp = await page.request.get(viewUrl);
  expect(resp.status()).toBe(200);

  const disposition = resp.headers()['content-disposition'] || '';
  expect(disposition).toContain('inline');
});
