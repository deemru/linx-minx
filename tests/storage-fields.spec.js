const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('storage: localStorage entry has all required fields', async ({ page }) => {
  await page.goto('/');

  await uploadAndWaitForLink(page, {
    name: 'fields-test.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('check all fields'),
  });

  const stored = await page.evaluate(() => localStorage.getItem('linx-minx-files'));
  expect(stored).toBeTruthy();

  const files = JSON.parse(stored);
  expect(files.length).toBeGreaterThanOrEqual(1);

  const entry = files[0];
  expect(entry).toHaveProperty('furl');
  expect(entry).toHaveProperty('dkey');
  expect(entry).toHaveProperty('expiry');
  expect(entry).toHaveProperty('size');
  expect(entry).toHaveProperty('filename');
  expect(entry).toHaveProperty('index');

  expect(entry.furl).toContain('/f/');
  expect(entry.dkey).toBeTruthy();
  expect(parseInt(entry.size)).toBeGreaterThan(0);
  expect(entry.filename).toContain('fields-test.txt');
  expect(typeof entry.index).toBe('number');
});

test('storage: file-index increments with each upload', async ({ page }) => {
  await page.goto('/');

  await uploadAndWaitForLink(page, {
    name: 'first.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('first'),
  });

  const idx1 = await page.evaluate(() => parseInt(localStorage.getItem('linx-minx-file-index')));

  await uploadAndWaitForLink(page, {
    name: 'second.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('second'),
  });

  const idx2 = await page.evaluate(() => parseInt(localStorage.getItem('linx-minx-file-index')));
  expect(idx2).toBe(idx1 + 1);
});

test('storage: newest file appears first in list', async ({ page }) => {
  await page.goto('/');

  await uploadAndWaitForLink(page, {
    name: 'older.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('older'),
  });

  await uploadAndWaitForLink(page, {
    name: 'newer.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('newer'),
  });

  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('linx-minx-files')));
  expect(stored[0].filename).toContain('newer.txt');
});

test('storage: delete removes entry from localStorage', async ({ page }) => {
  await page.goto('/');

  await uploadAndWaitForLink(page, {
    name: 'to-delete.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('will be deleted'),
  });

  // Reload to get storage-rendered list
  await page.reload();
  await page.waitForLoadState('networkidle');

  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 5000 });

  // Click delete on restored entry
  const cancelBtn = page.locator('#uploads .upload .cancel').first();
  await cancelBtn.click();

  // Wait for strikethrough
  await expect(page.locator('#uploads .upload.strikethrough').first()).toBeVisible({ timeout: 5000 });

  // Check localStorage no longer has that entry
  const stored = await page.evaluate(() => localStorage.getItem('linx-minx-files'));
  if (stored) {
    const files = JSON.parse(stored);
    const found = files.find(f => f.filename && f.filename.includes('to-delete.txt'));
    expect(found).toBeFalsy();
  }
});
