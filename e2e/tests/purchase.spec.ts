import { test, expect } from '@playwright/test';

// Full guest purchase flow. Requires MOCK_PACKLINK=true and MOCK_STRIPE=true on the backend.
test('guest can complete a purchase with mocked shipping + payment', async ({ page }) => {
  await page.goto('/productos');

  // Open the first product and add it to the cart.
  await page.locator('a[href^="/productos/"]').first().click();
  await expect(page).toHaveURL(/\/productos\/[^/]+$/);
  await page.getByRole('button', { name: /añadir al carrito/i }).click();

  // Navigate to the cart and proceed to checkout.
  await page.goto('/carrito');
  const goToCheckout = page.getByRole('link', { name: /pagar|finalizar|checkout|continuar/i })
    .or(page.getByRole('button', { name: /pagar|finalizar|checkout|continuar/i }));
  await goToCheckout.first().click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Fill contact + address.
  await page.fill('input[name="guestName"]',  'E2E Test Buyer');
  await page.fill('input[name="guestEmail"]', `buyer_${Date.now()}@test.local`);
  await page.fill('input[name="addrName"]',   'E2E Test Buyer');
  await page.fill('input[name="street"]',     'Calle Falsa 123');
  await page.fill('input[name="city"]',       'Madrid');
  await page.fill('input[name="postalCode"]', '28001');
  await page.selectOption('select[name="country"]', 'ES');

  // Wait for the mocked Packlink quote to populate and pick the first home service.
  const homeService = page.locator('input[name="packlinkService"]').first();
  await expect(homeService).toBeVisible({ timeout: 10_000 });
  await homeService.check();

  // Submit. MOCK_STRIPE returns a redirect URL straight to the confirmation page.
  await page.getByRole('button', { name: /pagar/i }).click();

  await expect(page).toHaveURL(/\/pedido\/[^/]+\?pagado=true/, { timeout: 15_000 });
  await expect(page.locator('text=/pagado|pago confirmado|paid/i').first()).toBeVisible();
});
