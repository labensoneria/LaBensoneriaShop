import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register a new account', async ({ page }) => {
    const email = `e2e_${Date.now()}@test.local`;
    await page.goto('/registro');

    await page.getByLabel(/nombre/i).first().fill('Usuario Test');
    await page.getByLabel(/correo|email/i).first().fill(email);
    await page.getByLabel(/contraseña/i).first().fill('TestPass123');

    await page.getByRole('button', { name: /crear|registr/i }).click();

    // After register, user is logged in and redirected to catalog.
    await expect(page).toHaveURL(/\/productos$/, { timeout: 10_000 });
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/correo|email/i).first().fill('nope@nope.local');
    await page.getByLabel(/contraseña/i).first().fill('wrongpass');
    await page.getByRole('button', { name: /iniciar|entrar|login/i }).click();
    await expect(page.locator('text=/inválid|incorrect|error/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
