const { test, expect } = require('@playwright/test');
const { uploadAndWaitForLink } = require('./helpers');

test('display page: shows file size', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'sizefile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('a'.repeat(500)),
  });

  await page.goto(href);

  // Size should be displayed (500 B)
  await expect(page.locator('.file-display-size')).toContainText('500 B');
});

test('display page: filename links to /v/ view route', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'linktest.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('view link test'),
  });

  await page.goto(href);

  const nameLink = page.locator('.file-display-name a');
  await expect(nameLink).toBeVisible({ timeout: 5000 });
  const linkHref = await nameLink.getAttribute('href');
  expect(linkHref).toContain('/v/');
  expect(linkHref).toContain('linktest.txt');
});

test('display page: download link points to /d/ route', async ({ page }) => {
  await page.goto('/');

  const href = await uploadAndWaitForLink(page, {
    name: 'dltest.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('download link test'),
  });

  await page.goto(href);

  const dlLink = page.locator('#download-link');
  await expect(dlLink).toBeVisible({ timeout: 5000 });
  const dlHref = await dlLink.getAttribute('href');
  expect(dlHref).toContain('/d/');
  expect(dlHref).toContain('dltest.txt');
});

test('display page: shows expiry info for non-permanent files', async ({ page }) => {
  await page.goto('/');

  // Select a non-zero expiry
  const buttons = page.locator('.expiry-btn');
  const count = await buttons.count();

  // Find a button with non-zero expiry
  let nonZeroBtn = null;
  for (let i = 0; i < count; i++) {
    const val = await buttons.nth(i).getAttribute('data-value');
    if (val !== '0') {
      nonZeroBtn = buttons.nth(i);
      break;
    }
  }

  if (nonZeroBtn) {
    await nonZeroBtn.click();
  }

  const href = await uploadAndWaitForLink(page, {
    name: 'expiryfile.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('expiry display test'),
  });

  await page.goto(href);

  // Should show expiry text
  const expiryEl = page.locator('.file-display-expiry');
  await expect(expiryEl).toBeVisible({ timeout: 5000 });
  await expect(expiryEl).toContainText('Link is valid for');
});
