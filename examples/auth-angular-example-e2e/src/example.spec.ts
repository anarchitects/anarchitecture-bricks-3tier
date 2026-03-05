import { expect, test, type Page } from '@playwright/test';

async function waitForApiReady(page: Page) {
  await expect
    .poll(
      async () => {
        const response = await page.request.get('/api/health');
        return response.status();
      },
      { timeout: 20000 }
    )
    .toBe(200);
}

async function loginAsAdmin(page: Page) {
  await waitForApiReady(page);
  await page.goto('/login');
  await page.fill('#credential', 'admin@example.com');
  await page.fill('#password', 'adminpass123');
  await page.click('button[type="submit"]');
  await expect(page.getByText('Logged in: admin@example.com')).toBeVisible();
}

test.describe('Auth Angular Example', () => {
  test('blocks guarded route before login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Admin (Guarded)' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.locator('header h1')).toHaveText('Auth Angular Example');
  });

  test('allows guarded route after login', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Admin (Guarded)' }).click();

    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
    await expect(page.getByText('Current user: admin@example.com')).toBeVisible();
  });

  test('removes guarded access after logout', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Logout' }).click();
    await page.click('button[type="submit"]');

    await page.getByRole('link', { name: 'Admin (Guarded)' }).click();

    await expect(page).toHaveURL('/');
  });
});
