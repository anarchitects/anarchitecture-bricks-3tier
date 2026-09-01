import { test, expect } from '@playwright/test';

test('renders login and registration package features', async ({ page }) => {
  await page.goto('/login');
  await expect(
    page.getByRole('link', { name: 'Auth Angular example' }),
  ).toBeVisible();
  await expect(page.locator('anarchitects-auth-feature-login')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  await page.getByRole('link', { name: 'Register' }).click();
  await expect(
    page.locator('anarchitects-auth-feature-register'),
  ).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
