import { test, expect } from '@playwright/test';

const ADMIN_EMAIL    = process.env.E2E_ADMIN_EMAIL    ?? 'admin@labensoneria.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'admin_dev_password';

test('admin can log in and reach the dashboard', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByPlaceholder(/correo|email/i).first().fill(ADMIN_EMAIL);
  await page.getByPlaceholder(/contraseña/i).first().fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /iniciar|entrar|login/i }).click();

  await expect(page).toHaveURL(/\/admin\/(dashboard|productos)$/, { timeout: 10_000 });
});
