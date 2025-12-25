import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /начать/i })).toBeVisible();
  });

  test('should display navigation', async ({ page }) => {
    await page.goto('/');

    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    await expect(navbar.getByRole('link', { name: /zharqynbala/i })).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/психологические тесты/i)).toBeVisible();
    await expect(page.getByText(/AI рекомендации/i)).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /тарифы/i })).toBeVisible();
    await expect(page.getByText(/бесплатный/i)).toBeVisible();
    await expect(page.getByText(/премиум/i)).toBeVisible();
    await expect(page.getByText(/для школ/i)).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/zharqynbala/i)).toBeVisible();
  });

  test('should navigate to login from CTA', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /войти/i }).click();

    await expect(page).toHaveURL('/login');
  });

  test('should navigate to registration from CTA', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /начать бесплатно/i }).click();

    await expect(page).toHaveURL('/register');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile menu button exists
    await expect(page.getByRole('button', { name: /меню/i })).toBeVisible();

    // Open mobile menu
    await page.getByRole('button', { name: /меню/i }).click();

    // Check mobile menu is visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should have correct meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain('ZharqynBala');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });
});
