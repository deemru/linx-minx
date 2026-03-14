const { test, expect } = require('@playwright/test');

test('main page: returns 200 with dropzone visible', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp.status()).toBe(200);

  // Dropzone area should be visible
  await expect(page.locator('#dzone')).toBeVisible({ timeout: 5000 });

  // Drop text should be present
  await expect(page.locator('#dzone')).toContainText('Drop file here');

  // Upload form exists with correct attributes
  const form = page.locator('#dropzone');
  await expect(form).toHaveAttribute('action', /upload/);
  await expect(form).toHaveAttribute('enctype', 'multipart/form-data');

  // Expiry buttons rendered
  const expiryBtns = page.locator('.expiry-btn');
  expect(await expiryBtns.count()).toBeGreaterThan(0);
});

test('static assets: CSS and JS return 200', async ({ request }) => {
  const assets = [
    '/static/css/linx-minx-upload.css',
    '/static/js/utils.js',
    '/static/js/upload-engine.js',
    '/static/js/upload.js',
    '/static/js/storage.js',
    '/static/js/expiry-buttons.js',
  ];

  for (const path of assets) {
    const resp = await request.get(path);
    expect(resp.status(), `${path} should return 200`).toBe(200);
    const body = await resp.text();
    expect(body.length, `${path} should not be empty`).toBeGreaterThan(0);
  }
});

test('robots.txt: accessible and non-empty', async ({ request }) => {
  const resp = await request.get('/robots.txt');
  expect(resp.status()).toBe(200);
  const body = await resp.text();
  expect(body).toContain('User-agent');
});

test('upload API: returns JSON with expected fields', async ({ request }) => {
  const resp = await request.post('/upload', {
    multipart: {
      file: {
        name: 'apitest.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('api format test'),
      },
      expires: '0',
    },
    headers: { Accept: 'application/json' },
  });

  expect(resp.status()).toBe(200);

  const json = await resp.json();
  expect(json).toHaveProperty('filename');
  expect(json).toHaveProperty('furl');
  expect(json).toHaveProperty('dkey');
  expect(json).toHaveProperty('expiry');
  expect(json).toHaveProperty('size');
  expect(json.filename).toBeTruthy();
  expect(json.furl).toContain('/f/');
  expect(parseInt(json.size)).toBeGreaterThan(0);
});

test('favicon: returns 200', async ({ request }) => {
  const resp = await request.get('/favicon.ico');
  expect(resp.status()).toBe(200);
});

test('unknown path: returns 404', async ({ request }) => {
  const resp = await request.get('/nonexistent/path/here');
  expect(resp.status()).toBe(404);
});
