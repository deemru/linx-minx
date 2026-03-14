const { test, expect } = require('@playwright/test');

test('DELETE with valid dkey removes file, GET returns 404', async ({ page, request }) => {
  await page.goto('/');

  // Upload via API directly
  const fileContent = Buffer.from('delete me via api');
  const resp = await request.post('/upload', {
    multipart: {
      file: { name: 'apidelete.txt', mimeType: 'text/plain', buffer: fileContent },
      expires: '0',
    },
    headers: { 'Accept': 'application/json' },
  });
  expect(resp.status()).toBe(200);

  const json = await resp.json();
  expect(json.furl).toBeTruthy();
  expect(json.dkey).toBeTruthy();

  // Verify file exists
  const downloadUrl = json.furl.replace('/f/', '/d/');
  const getResp = await request.get(downloadUrl);
  expect(getResp.status()).toBe(200);

  // Delete with dkey
  const delResp = await request.delete(json.furl, {
    headers: { 'dkey': json.dkey },
  });
  expect(delResp.status()).toBe(200);

  // Verify file is gone
  const afterDel = await request.get(downloadUrl);
  expect(afterDel.status()).toBe(404);
});

test('DELETE with wrong dkey is rejected', async ({ request }) => {
  // Upload
  const resp = await request.post('/upload', {
    multipart: {
      file: { name: 'nodelete.txt', mimeType: 'text/plain', buffer: Buffer.from('keep me') },
      expires: '0',
    },
    headers: { 'Accept': 'application/json' },
  });
  const json = await resp.json();

  // Try delete with wrong key
  const delResp = await request.delete(json.furl, {
    headers: { 'dkey': 'wrongkey' },
  });
  expect(delResp.status()).not.toBe(200);

  // File should still exist
  const downloadUrl = json.furl.replace('/f/', '/d/');
  const getResp = await request.get(downloadUrl);
  expect(getResp.status()).toBe(200);
});
