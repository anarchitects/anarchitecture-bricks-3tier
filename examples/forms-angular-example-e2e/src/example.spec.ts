import { test, expect } from '@playwright/test';

test('renders a form supplied by the forms package', async ({ page }) => {
  await page.route('**/api/forms/contact_default?formVersion=1', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        config: {
          id: 'contact_default',
          version: 1,
          fields: [
            {
              name: 'email',
              kind: 'email',
              ui: { label: 'Email address' },
              required: true,
            },
          ],
        },
        schema: { type: 'object' },
      }),
    }),
  );
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Forms Angular example' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Contact us' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  const easyMode = page.locator('[data-consumer-mode="easy"]');
  await expect(easyMode).toBeVisible();
  await expect
    .poll(() =>
      easyMode.evaluate((element) =>
        getComputedStyle(element)
          .getPropertyValue('--anx-control-block-size')
          .trim(),
      ),
    )
    .toBe('3.25rem');
});
