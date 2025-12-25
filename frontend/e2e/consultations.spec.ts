import { test, expect } from '@playwright/test';

test.describe('Consultations Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/пароль/i).fill('password123');
    await page.getByRole('button', { name: /войти/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test.describe('Psychologists List', () => {
    test('should display list of psychologists', async ({ page }) => {
      await page.goto('/consultations');

      await expect(page.getByRole('heading', { name: /консультации/i })).toBeVisible();
      await expect(page.locator('[data-testid="psychologist-card"]').first()).toBeVisible();
    });

    test('should filter by specialization', async ({ page }) => {
      await page.goto('/consultations');

      await page.getByRole('button', { name: /специализация/i }).click();
      await page.getByRole('option', { name: /детская психология/i }).click();

      await expect(page.locator('[data-testid="psychologist-card"]')).toBeVisible();
    });

    test('should show psychologist details', async ({ page }) => {
      await page.goto('/consultations');

      const card = page.locator('[data-testid="psychologist-card"]').first();
      await expect(card.getByText(/опыт/i)).toBeVisible();
      await expect(card.getByText(/₸/)).toBeVisible();
      await expect(card.getByTestId('rating')).toBeVisible();
    });
  });

  test.describe('Booking', () => {
    test('should open booking modal', async ({ page }) => {
      await page.goto('/consultations');

      await page.locator('[data-testid="psychologist-card"]').first()
        .getByRole('button', { name: /записаться/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should select date and time', async ({ page }) => {
      await page.goto('/consultations');
      await page.locator('[data-testid="psychologist-card"]').first()
        .getByRole('button', { name: /записаться/i }).click();

      // Select date
      await page.getByRole('button', { name: /выбрать дату/i }).click();
      await page.locator('[data-testid="calendar-day"]').first().click();

      // Select time
      await page.getByRole('button', { name: /10:00/i }).click();

      await expect(page.getByText(/выбрано/i)).toBeVisible();
    });

    test('should require child selection', async ({ page }) => {
      await page.goto('/consultations');
      await page.locator('[data-testid="psychologist-card"]').first()
        .getByRole('button', { name: /записаться/i }).click();

      await page.getByRole('button', { name: /подтвердить/i }).click();

      await expect(page.getByText(/выберите ребёнка/i)).toBeVisible();
    });

    test('should confirm booking', async ({ page }) => {
      await page.goto('/consultations');
      await page.locator('[data-testid="psychologist-card"]').first()
        .getByRole('button', { name: /записаться/i }).click();

      // Fill booking form
      await page.getByRole('combobox', { name: /ребёнок/i }).click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: /выбрать дату/i }).click();
      await page.locator('[data-testid="calendar-day"]').first().click();
      await page.getByRole('button', { name: /10:00/i }).click();

      await page.getByRole('button', { name: /подтвердить/i }).click();

      await expect(page.getByText(/запись создана/i)).toBeVisible();
    });
  });

  test.describe('My Consultations', () => {
    test('should display user consultations', async ({ page }) => {
      await page.goto('/consultations');

      await page.getByRole('tab', { name: /мои записи/i }).click();

      await expect(page.locator('[data-testid="consultation-item"]')).toBeVisible();
    });

    test('should show consultation status', async ({ page }) => {
      await page.goto('/consultations');
      await page.getByRole('tab', { name: /мои записи/i }).click();

      const item = page.locator('[data-testid="consultation-item"]').first();
      await expect(item.getByTestId('status-badge')).toBeVisible();
    });

    test('should allow cancellation', async ({ page }) => {
      await page.goto('/consultations');
      await page.getByRole('tab', { name: /мои записи/i }).click();

      await page.locator('[data-testid="consultation-item"]').first()
        .getByRole('button', { name: /отменить/i }).click();
      await page.getByRole('button', { name: /да, отменить/i }).click();

      await expect(page.getByText(/запись отменена/i)).toBeVisible();
    });

    test('should show join button for confirmed consultations', async ({ page }) => {
      await page.goto('/consultations');
      await page.getByRole('tab', { name: /мои записи/i }).click();

      const confirmedItem = page.locator('[data-testid="consultation-item"]')
        .filter({ has: page.getByText(/подтверждена/i) }).first();

      if (await confirmedItem.count() > 0) {
        await expect(confirmedItem.getByRole('button', { name: /присоединиться/i })).toBeVisible();
      }
    });
  });
});
