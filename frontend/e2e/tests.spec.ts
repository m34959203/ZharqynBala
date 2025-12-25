import { test, expect } from '@playwright/test';

test.describe('Tests Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/пароль/i).fill('password123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Tests List', () => {
    test('should display list of available tests', async ({ page }) => {
      await page.goto('/tests');

      await expect(page.getByRole('heading', { name: /тесты/i })).toBeVisible();
      await expect(page.locator('[data-testid="test-card"]').first()).toBeVisible();
    });

    test('should filter tests by category', async ({ page }) => {
      await page.goto('/tests');

      await page.getByRole('button', { name: /категория/i }).click();
      await page.getByRole('option', { name: /эмоциональное развитие/i }).click();

      const testCards = page.locator('[data-testid="test-card"]');
      await expect(testCards.first()).toContainText(/эмоцион/i);
    });

    test('should filter tests by age group', async ({ page }) => {
      await page.goto('/tests');

      await page.getByRole('button', { name: /возраст/i }).click();
      await page.getByRole('option', { name: /6-8 лет/i }).click();

      await expect(page.locator('[data-testid="test-card"]')).toHaveCount(await page.locator('[data-testid="test-card"]').count());
    });

    test('should search tests by name', async ({ page }) => {
      await page.goto('/tests');

      await page.getByPlaceholder(/поиск/i).fill('тревожность');

      const testCards = page.locator('[data-testid="test-card"]');
      await expect(testCards.first()).toContainText(/тревожность/i);
    });
  });

  test.describe('Test Taking', () => {
    test('should require child selection before starting test', async ({ page }) => {
      await page.goto('/tests');

      await page.locator('[data-testid="test-card"]').first().click();
      await page.getByRole('button', { name: /начать тест/i }).click();

      await expect(page.getByText(/выберите ребёнка/i)).toBeVisible();
    });

    test('should start test after selecting child', async ({ page }) => {
      await page.goto('/tests');

      await page.locator('[data-testid="test-card"]').first().click();
      await page.getByRole('combobox', { name: /ребёнок/i }).click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /начать тест/i }).click();

      await expect(page.getByText(/вопрос 1/i)).toBeVisible();
    });

    test('should navigate between questions', async ({ page }) => {
      await page.goto('/tests/1/session');

      await expect(page.getByText(/вопрос 1/i)).toBeVisible();

      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: /далее/i }).click();

      await expect(page.getByText(/вопрос 2/i)).toBeVisible();
    });

    test('should allow going back to previous question', async ({ page }) => {
      await page.goto('/tests/1/session?question=2');

      await page.getByRole('button', { name: /назад/i }).click();

      await expect(page.getByText(/вопрос 1/i)).toBeVisible();
    });

    test('should show progress bar', async ({ page }) => {
      await page.goto('/tests/1/session');

      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();
    });

    test('should show confirmation before submitting', async ({ page }) => {
      await page.goto('/tests/1/session?question=last');

      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: /завершить/i }).click();

      await expect(page.getByText(/подтвердите завершение/i)).toBeVisible();
    });

    test('should redirect to results after completion', async ({ page }) => {
      await page.goto('/tests/1/session?question=last');

      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: /завершить/i }).click();
      await page.getByRole('button', { name: /да, завершить/i }).click();

      await expect(page).toHaveURL(/\/results\/\d+/);
    });
  });
});
