import { test, expect } from '@playwright/test';

test.describe('Public catalog', () => {
  test('home redirects to /productos and shows products', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/productos$/);
    // Seed creates 3 products; at least one product link should be present.
    const productLinks = page.locator('a[href^="/productos/"]');
    await expect(productLinks.first()).toBeVisible({ timeout: 10_000 });
  });

  test('product detail page loads from catalog', async ({ page }) => {
    await page.goto('/productos');
    const firstProduct = page.locator('a[href^="/productos/"]').first();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/productos\/[^/]+$/);
    await expect(page.getByRole('button', { name: /añadir al carrito/i })).toBeVisible();
  });
});
