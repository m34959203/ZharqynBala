import { test, expect } from '@playwright/test';

test.describe('Children Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/пароль/i).fill('password123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Children List', () => {
    test('should display list of children', async ({ page }) => {
      await page.goto('/children');

      await expect(page.getByRole('heading', { name: /мои дети/i })).toBeVisible();
    });

    test('should show add child button', async ({ page }) => {
      await page.goto('/children');

      await expect(page.getByRole('button', { name: /добавить ребёнка/i })).toBeVisible();
    });

    test('should display child cards with info', async ({ page }) => {
      await page.goto('/children');

      const childCard = page.locator('[data-testid="child-card"]').first();
      await expect(childCard.getByText(/лет/i)).toBeVisible();
    });
  });

  test.describe('Add Child', () => {
    test('should open add child modal', async ({ page }) => {
      await page.goto('/children');

      await page.getByRole('button', { name: /добавить ребёнка/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /добавить ребёнка/i })).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/children');
      await page.getByRole('button', { name: /добавить ребёнка/i }).click();

      await page.getByRole('button', { name: /сохранить/i }).click();

      await expect(page.getByText(/имя обязательно/i)).toBeVisible();
      await expect(page.getByText(/дата рождения обязательна/i)).toBeVisible();
    });

    test('should add new child successfully', async ({ page }) => {
      await page.goto('/children');
      await page.getByRole('button', { name: /добавить ребёнка/i }).click();

      await page.getByLabel(/имя/i).fill('Тестовый Ребёнок');
      await page.getByLabel(/дата рождения/i).fill('2018-05-15');
      await page.getByRole('combobox', { name: /пол/i }).click();
      await page.getByRole('option', { name: /мальчик/i }).click();
      await page.getByLabel(/класс/i).fill('2А');
      await page.getByLabel(/школа/i).fill('Школа №1');

      await page.getByRole('button', { name: /сохранить/i }).click();

      await expect(page.getByText(/ребёнок добавлен/i)).toBeVisible();
      await expect(page.getByText('Тестовый Ребёнок')).toBeVisible();
    });
  });

  test.describe('Edit Child', () => {
    test('should open edit modal', async ({ page }) => {
      await page.goto('/children');

      await page.locator('[data-testid="child-card"]').first().getByRole('button', { name: /редактировать/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /редактировать/i })).toBeVisible();
    });

    test('should update child info', async ({ page }) => {
      await page.goto('/children');
      await page.locator('[data-testid="child-card"]').first().getByRole('button', { name: /редактировать/i }).click();

      await page.getByLabel(/класс/i).fill('3Б');
      await page.getByRole('button', { name: /сохранить/i }).click();

      await expect(page.getByText(/данные обновлены/i)).toBeVisible();
    });
  });

  test.describe('Delete Child', () => {
    test('should show confirmation before delete', async ({ page }) => {
      await page.goto('/children');

      await page.locator('[data-testid="child-card"]').first().getByRole('button', { name: /удалить/i }).click();

      await expect(page.getByText(/вы уверены/i)).toBeVisible();
    });

    test('should cancel delete on cancel button', async ({ page }) => {
      await page.goto('/children');
      const childName = await page.locator('[data-testid="child-card"]').first().getByTestId('child-name').textContent();

      await page.locator('[data-testid="child-card"]').first().getByRole('button', { name: /удалить/i }).click();
      await page.getByRole('button', { name: /отмена/i }).click();

      await expect(page.getByText(childName!)).toBeVisible();
    });

    test('should delete child on confirm', async ({ page }) => {
      await page.goto('/children');
      const initialCount = await page.locator('[data-testid="child-card"]').count();

      await page.locator('[data-testid="child-card"]').first().getByRole('button', { name: /удалить/i }).click();
      await page.getByRole('button', { name: /да, удалить/i }).click();

      await expect(page.getByText(/ребёнок удалён/i)).toBeVisible();
      await expect(page.locator('[data-testid="child-card"]')).toHaveCount(initialCount - 1);
    });
  });

  test.describe('Child Profile', () => {
    test('should navigate to child profile', async ({ page }) => {
      await page.goto('/children');

      await page.locator('[data-testid="child-card"]').first().click();

      await expect(page).toHaveURL(/\/children\/\d+/);
    });

    test('should display child test history', async ({ page }) => {
      await page.goto('/children/1');

      await expect(page.getByRole('heading', { name: /история тестов/i })).toBeVisible();
    });

    test('should display progress charts', async ({ page }) => {
      await page.goto('/children/1');

      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    });
  });
});
