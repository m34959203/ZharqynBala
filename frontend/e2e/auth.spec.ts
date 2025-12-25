import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /вход/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/пароль/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /войти/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/email обязателен/i)).toBeVisible();
      await expect(page.getByText(/пароль обязателен/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@test.com');
      await page.getByLabel(/пароль/i).fill('wrongpassword');
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page.getByText(/неверный email или пароль/i)).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/пароль/i).fill('password123');
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page).toHaveURL('/dashboard');
    });

    test('should have link to registration page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /регистрация/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL('/register');
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('link', { name: /забыли пароль/i })).toBeVisible();
    });
  });

  test.describe('Registration Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
      await expect(page.getByLabel(/имя/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/пароль/i)).toBeVisible();
      await expect(page.getByLabel(/подтвердите пароль/i)).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/^пароль$/i).fill('password123');
      await page.getByLabel(/подтвердите пароль/i).fill('different');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/пароли не совпадают/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/email/i).fill('invalid-email');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/некорректный email/i)).toBeVisible();
    });

    test('should show success message on valid registration', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel(/имя/i).fill('Test User');
      await page.getByLabel(/email/i).fill(`test${Date.now()}@example.com`);
      await page.getByLabel(/^пароль$/i).fill('Password123!');
      await page.getByLabel(/подтвердите пароль/i).fill('Password123!');
      await page.getByRole('button', { name: /зарегистрироваться/i }).click();

      await expect(page.getByText(/регистрация успешна/i)).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout user and redirect to home', async ({ page }) => {
      // First login
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/пароль/i).fill('password123');
      await page.getByRole('button', { name: /войти/i }).click();

      await expect(page).toHaveURL('/dashboard');

      // Then logout
      await page.getByRole('button', { name: /профиль/i }).click();
      await page.getByRole('menuitem', { name: /выйти/i }).click();

      await expect(page).toHaveURL('/');
    });
  });
});
