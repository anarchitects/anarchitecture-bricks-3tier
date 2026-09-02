import { test, expect } from '@playwright/test';

test('renders login and registration package features', async ({ page }) => {
  await page.goto('/login');
  await expect(
    page.getByRole('link', { name: 'Auth Angular example' }),
  ).toBeVisible();
  await expect(page.locator('anarchitects-auth-feature-login')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  const advancedMode = page.locator('[data-consumer-mode="advanced"]');
  await expect(advancedMode).toBeVisible();
  await expect
    .poll(() =>
      advancedMode.evaluate((element) =>
        getComputedStyle(element)
          .getPropertyValue('--anx-control-block-size')
          .trim(),
      ),
    )
    .toBe('2.25rem');
  await expect
    .poll(() =>
      advancedMode.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--anx-color-accent').trim(),
      ),
    )
    .toBe('oklch(0.64 0.18 235)');

  await page.getByRole('link', { name: 'Register' }).click();
  await expect(
    page.locator('anarchitects-auth-feature-register'),
  ).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});
