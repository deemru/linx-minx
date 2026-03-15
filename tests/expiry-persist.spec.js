const { test, expect } = require('@playwright/test');

test('expiry: selection persists after reload', async ({ page }) => {
  await page.goto('/');

  const buttons = page.locator('.expiry-btn');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(1);

  // Click the last button (non-default)
  const lastBtn = buttons.last();
  const lastValue = await lastBtn.getAttribute('data-value');
  await lastBtn.click();
  await expect(lastBtn).toHaveClass(/active/);

  // Reload
  await page.reload();
  await page.waitForLoadState('networkidle');

  // The same button should be active
  const restoredActive = page.locator('.expiry-btn.active');
  await expect(restoredActive).toBeVisible({ timeout: 5000 });
  const restoredValue = await restoredActive.getAttribute('data-value');
  expect(restoredValue).toBe(lastValue);

  // Hidden select should match
  const selectVal = await page.locator('#expires').inputValue();
  expect(selectVal).toBe(lastValue);
});
