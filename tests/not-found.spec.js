const { test, expect } = require('@playwright/test');

test('404 for nonexistent file', async ({ request }) => {
  const resp = await request.get('/f/nonexistent/fakefile.txt');
  expect(resp.status()).toBe(404);
});

test('404 for nonexistent route', async ({ request }) => {
  const resp = await request.get('/doesnotexist');
  expect(resp.status()).toBe(404);
});
