import { test, expect } from '@playwright/test';

test.describe('Results Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/пароль/i).fill('password123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Results List', () => {
    test('should display list of test results', async ({ page }) => {
      await page.goto('/results');

      await expect(page.getByRole('heading', { name: /результаты/i })).toBeVisible();
    });

    test('should filter results by child', async ({ page }) => {
      await page.goto('/results');

      await page.getByRole('combobox', { name: /ребёнок/i }).click();
      await page.getByRole('option').first().click();

      await expect(page.locator('[data-testid="result-card"]')).toBeVisible();
    });

    test('should filter results by date range', async ({ page }) => {
      await page.goto('/results');

      await page.getByLabel(/от/i).fill('2024-01-01');
      await page.getByLabel(/до/i).fill('2024-12-31');
      await page.getByRole('button', { name: /применить/i }).click();

      await expect(page.locator('[data-testid="result-card"]')).toBeVisible();
    });

    test('should sort results by date', async ({ page }) => {
      await page.goto('/results');

      await page.getByRole('button', { name: /сортировка/i }).click();
      await page.getByRole('option', { name: /сначала новые/i }).click();

      const dates = await page.locator('[data-testid="result-date"]').allTextContents();
      expect(dates).toEqual([...dates].sort().reverse());
    });
  });

  test.describe('Result Details', () => {
    test('should display detailed result', async ({ page }) => {
      await page.goto('/results/1');

      await expect(page.getByRole('heading', { name: /результат теста/i })).toBeVisible();
      await expect(page.locator('[data-testid="score-chart"]')).toBeVisible();
    });

    test('should show score breakdown', async ({ page }) => {
      await page.goto('/results/1');

      await expect(page.getByText(/общий балл/i)).toBeVisible();
      await expect(page.locator('[data-testid="category-scores"]')).toBeVisible();
    });

    test('should display AI recommendations', async ({ page }) => {
      await page.goto('/results/1');

      await expect(page.getByRole('heading', { name: /рекомендации/i })).toBeVisible();
      await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible();
    });

    test('should allow PDF export', async ({ page }) => {
      await page.goto('/results/1');

      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /скачать PDF/i }).click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('should allow sharing result', async ({ page }) => {
      await page.goto('/results/1');

      await page.getByRole('button', { name: /поделиться/i }).click();

      await expect(page.getByText(/ссылка скопирована/i)).toBeVisible();
    });
  });

  test.describe('Comparison', () => {
    test('should compare results over time', async ({ page }) => {
      await page.goto('/results/compare');

      await page.getByRole('combobox', { name: /ребёнок/i }).click();
      await page.getByRole('option').first().click();

      await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible();
    });

    test('should show progress trends', async ({ page }) => {
      await page.goto('/results/compare');

      await page.getByRole('combobox', { name: /ребёнок/i }).click();
      await page.getByRole('option').first().click();

      await expect(page.getByText(/динамика/i)).toBeVisible();
    });
  });
});
