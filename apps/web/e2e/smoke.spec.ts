import { test, expect } from '@playwright/test';

test.describe('Public Site', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Football Club Community Raffle')).toBeVisible();
  });

  test('raffles page loads', async ({ page }) => {
    await page.goto('/raffles');
    await expect(page.getByRole('heading', { name: 'Active Raffles' })).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });
});
