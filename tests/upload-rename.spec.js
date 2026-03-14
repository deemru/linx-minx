const { test, expect } = require('@playwright/test');
const { uploadFiles } = require('./helpers');

test('rename: Cyrillic filename transliterated', async ({ page }) => {
  await page.goto('/');

  await uploadFiles(page, {
    name: 'Криптография тест.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('cyrillic filename test'),
  });

  const link = page.locator('#uploads .upload a').first();
  await expect(link).toBeVisible({ timeout: 10000 });

  const linkText = await link.textContent();
  // "крипт" → "crypt", rest transliterated, space → _
  expect(linkText).toContain('Crypt');
  expect(linkText).not.toMatch(/[а-яА-ЯёЁ]/);
});
