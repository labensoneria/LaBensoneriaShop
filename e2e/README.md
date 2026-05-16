# e2e — Playwright

End-to-end tests for La Bensonería. Run against a real backend + frontend with **all paid third-party services mocked**, so this suite incurs zero cost in CI or locally.

## Implemented tests

### [tests/catalog.spec.ts](tests/catalog.spec.ts) — Public catalog

- **`home redirects to /productos and shows products`** — Verifies the root URL `/` redirects to `/productos` (per [App.tsx:39](../frontend/src/App.tsx#L39)) and at least one product card from the seed (3 products) is rendered.
- **`product detail page loads from catalog`** — Clicks the first product card, asserts the URL matches `/productos/:id`, and that the "Añadir al carrito" button is visible.

### [tests/auth.spec.ts](tests/auth.spec.ts) — Authentication

- **`user can register a new account`** — Fills the registration form with a unique email, submits, and asserts the user is redirected to `/productos` (auto-login on register, per Fase 3 decisions in [CLAUDE.md](../CLAUDE.md)).
- **`invalid login shows error`** — Submits wrong credentials and asserts an error message surfaces.

### [tests/purchase.spec.ts](tests/purchase.spec.ts) — Full guest purchase

End-to-end smoke of the highest-value flow. Depends on `MOCK_PACKLINK=true` + `MOCK_STRIPE=true`.

1. Open catalog → first product → click "Añadir al carrito".
2. Navigate to `/carrito`, then proceed to checkout.
3. Fill contact + Spanish address (Madrid, 28001).
4. Wait for the mocked Packlink quote to render and pick the first home-delivery service (returned by `MOCK_PACKLINK`).
5. Click "Pagar con tarjeta". `MOCK_STRIPE` skips the Stripe redirect and marks the order `PAID/PROCESSING`, returning `/pedido/:id?pagado=true` directly.
6. Asserts the confirmation page loads and shows paid status.

### [tests/admin.spec.ts](tests/admin.spec.ts) — Admin login

- **`admin can log in and reach the dashboard`** — Logs in at `/admin/login` using `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seeded by [backend/prisma/seed.ts](../backend/prisma/seed.ts)) and asserts the redirect to `/admin/dashboard`.

## What is *not* covered (yet)

- Admin product creation (touches Cloudinary upload — would need `MOCK_CLOUDINARY`).
- Order status transitions in admin (PROCESSING → SHIPPED triggers `packlink.createShipment`; the mock returns a fake reference, but the spec isn't written yet).
- Reviews flow (requires a completed order seeded first).
- Stripe webhook signature verification (better tested with a backend integration test, not e2e).
- Cart persistence across reloads.
- Pickup-point selection (the mocked dropoffs fixture returns 2 points; spec not written yet).

## Mocks (set as env vars on the backend process)

| Var              | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `MOCK_PACKLINK`  | `packlink.service.ts` returns fixtures for quote/dropoffs/shipment instead of calling Packlink. |
| `MOCK_STRIPE`    | `payments.service.ts` skips `stripe.checkout.sessions.create` and marks the order PAID+PROCESSING immediately, then redirects to `/pedido/:id?pagado=true`. |
| (no `NODE_ENV=production`) | `email.service.ts` already logs instead of calling Resend in any non-production env. |

Both `MOCK_*` flags will throw on startup if `NODE_ENV=production`.

## Running locally

```bash
# 1. Start backend with mocks
cd backend
MOCK_PACKLINK=true MOCK_STRIPE=true npm run dev

# 2. Start frontend
cd frontend && npm run dev

# 3. Run tests
cd e2e
npm install
npx playwright install --with-deps chromium
npm test
```

## CI

Workflow: [.github/workflows/e2e.yml](../.github/workflows/e2e.yml). Runs on PRs touching `frontend/`, `backend/`, or `e2e/`. Uses a Postgres service container, only chromium, with `concurrency.cancel-in-progress` to avoid wasting minutes.
