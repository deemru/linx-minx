const { test, expect } = require('@playwright/test');

test('content-type: main page returns text/html', async ({ request }) => {
  const resp = await request.get('/');
  const ct = resp.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});

test('content-type: CSS returns text/css', async ({ request }) => {
  const resp = await request.get('/static/css/linx-minx-upload.css');
  const ct = resp.headers()['content-type'] || '';
  expect(ct).toContain('text/css');
});

test('content-type: JS returns javascript', async ({ request }) => {
  const resp = await request.get('/static/js/upload-engine.js');
  const ct = resp.headers()['content-type'] || '';
  expect(ct).toMatch(/javascript/);
});

test('content-type: upload JSON response has application/json', async ({ request }) => {
  const resp = await request.post('/upload', {
    multipart: {
      file: {
        name: 'ct-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('content type test'),
      },
      expires: '0',
    },
    headers: { Accept: 'application/json' },
  });

  const ct = resp.headers()['content-type'] || '';
  expect(ct).toContain('application/json');
});

test('content-type: 404 page returns text/html', async ({ request }) => {
  const resp = await request.get('/f/nonexistent/fakefile.txt');
  expect(resp.status()).toBe(404);
  const ct = resp.headers()['content-type'] || '';
  expect(ct).toContain('text/html');
});
