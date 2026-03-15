const { test, expect } = require('@playwright/test');

test('expiry buttons: click sets select value and saves to localStorage', async ({ page }) => {
  await page.goto('/');

  const buttons = page.locator('.expiry-btn');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);

  // Click first button
  const firstBtn = buttons.first();
  const value = await firstBtn.getAttribute('data-value');
  await firstBtn.click();

  // Should be active
  await expect(firstBtn).toHaveClass(/active/);

  // Hidden select should match
  const selectVal = await page.locator('#expires').inputValue();
  expect(selectVal).toBe(value);

  // localStorage should have it
  const stored = await page.evaluate(() => localStorage.getItem('linx-minx-expiry'));
  expect(stored).toBe(value);

  // Click a different button if available
  if (count > 1) {
    const secondBtn = buttons.nth(1);
    const value2 = await secondBtn.getAttribute('data-value');
    await secondBtn.click();

    await expect(secondBtn).toHaveClass(/active/);
    await expect(firstBtn).not.toHaveClass(/active/);

    const selectVal2 = await page.locator('#expires').inputValue();
    expect(selectVal2).toBe(value2);
  }
});
