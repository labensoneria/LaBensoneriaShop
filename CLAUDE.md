# CLAUDE.md — La Bensonería

> Este archivo es la fuente de verdad para Claude Code.
> Léelo completo al inicio de cada sesión antes de tocar cualquier archivo.

---

## 0. Directrices de comportamiento

Pautas generales para reducir errores comunes al programar. Complementan (no sustituyen) las reglas específicas del proyecto en las secciones siguientes.

**Tradeoff:** Estas directrices priorizan cautela sobre velocidad. Para tareas triviales, usa el criterio.

### 0.1 Pensar antes de codificar

**No asumas. No ocultes dudas. Expón los tradeoffs.**

Antes de implementar:
- Declara tus suposiciones explícitamente. Si dudas, pregunta.
- Si existen varias interpretaciones posibles, preséntalas — no elijas en silencio.
- Si existe un enfoque más simple, dilo. Empuja cuando tenga sentido.
- Si algo no está claro, para. Nombra lo que confunde. Pregunta.

### 0.2 Simplicidad primero

**Código mínimo que resuelva el problema. Nada especulativo.**

- Nada más allá de lo pedido.
- Sin abstracciones para código usado una sola vez.
- Sin "flexibilidad" ni "configurabilidad" no solicitada.
- Sin manejo de errores para escenarios imposibles.
- Si escribes 200 líneas y podrían ser 50, reescríbelo.

Pregúntate: "¿Un ingeniero senior diría que esto está sobrecomplicado?" Si sí, simplifica.

### 0.3 Cambios quirúrgicos

**Toca solo lo necesario. Limpia solo tu propio desorden.**

Al editar código existente:
- No "mejores" código, comentarios o formato adyacentes.
- No refactorices lo que no está roto.
- Respeta el estilo existente, aunque tú lo harías distinto.
- Si detectas código muerto no relacionado, menciónalo — no lo borres.

Cuando tus cambios creen huérfanos:
- Elimina imports/variables/funciones que TUS cambios dejaron sin uso.
- No borres código muerto preexistente salvo que te lo pidan.

El test: cada línea cambiada debe trazarse directamente a la petición del usuario.

### 0.4 Ejecución guiada por objetivos

**Define criterios de éxito. Itera hasta verificar.**

Transforma tareas en objetivos verificables:
- "Añadir validación" → "Escribir tests para inputs inválidos y hacerlos pasar"
- "Arreglar el bug" → "Escribir un test que lo reproduzca y hacerlo pasar"
- "Refactorizar X" → "Asegurar que los tests pasan antes y después"

Para tareas multi-paso, enuncia un plan breve:

```
1. [Paso] → verificar: [comprobación]
2. [Paso] → verificar: [comprobación]
3. [Paso] → verificar: [comprobación]
```

Criterios de éxito fuertes permiten iterar de forma independiente. Criterios débiles ("que funcione") requieren aclaraciones constantes.

---

## 1. Qué es este proyecto

**La Bensonería** es una tienda online de productos de crochet artesanal (llaveros y peluches).
Incluye una tienda pública para clientes y un panel de administración completo.

El proyecto está en desarrollo activo. Seguimos un plan de fases numeradas.
**Nunca saltes fases ni implementes funcionalidad futura sin que se indique explícitamente.**

---

## 2. Stack tecnológico

| Capa                | Tecnología                    | Notas                                           |
| ------------------- | ------------------------------ | ----------------------------------------------- |
| Frontend            | React 18 + Vite + TypeScript   | SPA en `/frontend`                            |
| Backend             | Express + TypeScript           | API REST en `/backend`                        |
| ORM                 | Prisma                         | Esquema en `/backend/prisma/schema.prisma`    |
| Base de datos       | PostgreSQL 15                  | Gestionada vía Docker (local) o Railway (prod) |
| Imágenes           | Cloudinary                     | SDK `cloudinary`en backend                    |
| Autenticación      | JWT (jsonwebtoken) + bcryptjs  | Sin sesiones de servidor                        |
| Contenedores        | Docker + Docker Compose        | Solo para desarrollo local                      |
| Despliegue frontend | Vercel                         | Repositorio conectado, deploy automático       |
| Despliegue backend  | Railway                        | Backend + PostgreSQL en Railway                 |
| Tests frontend      | Vitest + React Testing Library |                                                 |
| Tests backend       | Jest + Supertest               |                                                 |

---

## 3. Estructura de carpetas

```
la-bensoneria/
├── CLAUDE.md                  ← este archivo
├── docker-compose.yml
├── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/        ← componentes reutilizables
│   │   ├── pages/             ← una carpeta por página/ruta
│   │   ├── hooks/             ← custom hooks
│   │   ├── store/             ← estado global (Zustand)
│   │   ├── api/               ← funciones fetch tipadas
│   │   ├── types/             ← tipos TypeScript compartidos
│   │   └── utils/
│   ├── public/
│   │   └── logo.png           ← logo existente (sustituir)
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/            ← un archivo por dominio
│   │   ├── controllers/       ← lógica de cada ruta
│   │   ├── middleware/        ← auth, errorHandler, etc.
│   │   ├── services/          ← lógica de negocio
│   │   ├── utils/
│   │   └── app.ts             ← setup Express
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── tests/
│   └── tsconfig.json
│
└── shared/
    └── types/                 ← tipos compartidos frontend/backend
```

---

## 4. Modelo de datos (Prisma)

```prisma
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String?
  name           String?
  isAdmin        Boolean  @default(false)
  createdAt      DateTime @default(now())
  addressName    String?
  addressStreet  String?
  addressStreet2 String?
  addressCity    String?
  addressPostal  String?
  addressCountry String?
  orders         Order[]
  reviews        Review[]
}

model Product {
  id                    String         @id @default(uuid())
  name                  String
  description           String
  price                 Decimal        @db.Decimal(10, 2)
  convertibleToKeychain Boolean        @default(false)
  soldCount             Int            @default(0)
  active                Boolean        @default(true)
  publishedAt           DateTime       @default(now())
  images                ProductImage[]
  orderItems            OrderItem[]
  reviews               Review[]
}

model ProductImage {
  id            String  @id @default(uuid())
  productId     String
  cloudinaryUrl String
  order         Int     @default(0)
  product       Product @relation(fields: [productId], references: [id])
}

model Order {
  id           String          @id @default(uuid())
  userId       String?
  guestEmail   String?
  guestName    String?
  status       OrderStatus     @default(PENDING)
  subtotal     Decimal         @db.Decimal(10, 2)
  shippingCost Decimal         @db.Decimal(10, 2)
  total        Decimal         @db.Decimal(10, 2)
  createdAt    DateTime        @default(now())
  user         User?           @relation(fields: [userId], references: [id])
  items        OrderItem[]
  address      ShippingAddress?
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  COMPLETED
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  asKeychain Boolean @default(false)
  unitPrice Decimal @db.Decimal(10, 2)
  order     Order   @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}

model ShippingAddress {
  id         String @id @default(uuid())
  orderId    String @unique
  name       String
  street     String
  city       String
  postalCode String
  country    String
  order      Order  @relation(fields: [orderId], references: [id])
}

model Review {
  id        String   @id @default(uuid())
  productId String
  userId    String?
  stars     Int
  comment   String?
  createdAt DateTime @default(now())
  product   Product  @relation(fields: [productId], references: [id])
  user      User?    @relation(fields: [userId], references: [id])
}

model PopupMessage {
  id        String   @id @default(uuid())
  content   String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}

model AppSettings {
  key   String @id
  value String
}
// Claves usadas en AppSettings:
// "ordersEnabled"      → "true" | "false"
// "newProductDays"     → número de días (default "14")
```

---

## 5. Variables de entorno

El archivo `.env.example` en la raíz define todas las variables necesarias.
**Nunca hardcodees valores sensibles en el código.**

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/labensoneria
JWT_SECRET=cambia_esto_en_produccion
JWT_EXPIRES_IN=7d
PORT=3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend
VITE_API_URL=http://localhost:3000

# Admin inicial (solo para seed)
ADMIN_EMAIL=admin@labensoneria.com
ADMIN_PASSWORD=cambia_esto
```

---

## 6. Endpoints principales de la API

### Productos (público)

```
GET    /api/products              → catálogo (query: sort, page, limit)
GET    /api/products/:id          → ficha de producto
```

### Productos (admin)

```
POST   /api/admin/products        → crear producto
PUT    /api/admin/products/:id    → editar producto
DELETE /api/admin/products/:id    → desactivar (soft delete)
POST   /api/admin/products/:id/images → subir imágenes a Cloudinary
```

### Pedidos

```
POST   /api/orders                → crear pedido (guest o autenticado)
GET    /api/orders/:id            → detalle de pedido (propio o admin)
GET    /api/admin/orders          → lista de pedidos (admin)
PUT    /api/admin/orders/:id/status → cambiar estado (admin)
```

### Autenticación

```
POST   /api/auth/register         → crear cuenta
POST   /api/auth/login            → login → JWT
GET    /api/auth/me               → perfil autenticado
```

### Reviews

```
POST   /api/reviews               → crear review (autenticado, pedido completado)
GET    /api/products/:id/reviews  → reviews de un producto
```

### Admin / configuración

```
GET    /api/admin/settings        → leer ajustes
PUT    /api/admin/settings        → actualizar ajustes (ordersEnabled, newProductDays)
GET    /api/admin/reports         → ventas en rango de fechas
POST   /api/admin/popup           → crear mensaje emergente
GET    /api/popup                 → mensaje emergente activo (público)
```

### Pagos (Stripe)

```http
POST   /api/payments/stripe/checkout-session → crear sesión Stripe Checkout → devuelve { sessionUrl }
POST   /api/payments/stripe/webhook          → webhook de Stripe (body raw, verifica firma)
```

---

## 7. Convenciones de código

### General

* TypeScript estricto en frontend y backend (`"strict": true`)
* Sin `any` explícito. Si es necesario, usar `unknown` y narrow.
* Nombrado en **camelCase** para variables y funciones, **PascalCase** para tipos y componentes
* Archivos de componentes: `NombreComponente.tsx`
* Archivos de rutas Express: `nombre.routes.ts`

### Frontend

* Estado global con **Zustand** (stores en `src/store/`)
* Carrito en `localStorage` y Zustand para usuarios no autenticados
* Fetch tipado en `src/api/` — nunca fetch directo en componentes
* Clases CSS con **Tailwind** (configurado con la paleta de La Bensonería)

### Backend

* Controladores delgados: la lógica va en servicios (`src/services/`)
* Errores con un `AppError` centralizado + middleware `errorHandler`
* Validación de inputs con **zod**
* Middleware `requireAuth`, `requireAdmin` y `optionalAuth` para rutas protegidas o de acceso mixto

### Paleta de colores (Tailwind)

```js
// tailwind.config.js
colors: {
  brand: {
    green:      '#4A7C59',   // verde prado (logo)
    greenLight: '#7FAF8A',
    sky:        '#5B9BD5',   // azul cielo (logo)
    skyLight:   '#A8CBEE',
    cream:      '#FAF7F0',   // fondo principal
    dark:       '#2C3E2D',
  }
}
```

## 8. Restricciones importantes (NO hacer sin consultar)

* **NO implementes pasarela de pago** sin presentar primero las alternativas disponibles (Stripe, PayPal, Redsys, Bizum) con ventajas e inconvenientes.
* **NO implementes cálculo de envío** sin presentar primero las alternativas (tabla fija, API Correos, tarifa por peso/zona).
* **NO elimines datos** de la base de datos. Usa soft delete (`active: false`).
* **NO hardcodees** URLs, claves API ni contraseñas.
* **NO saltes fases** ni implementes funcionalidad marcada en fases futuras.
* **`product.active` y `ordersEnabled` son conceptos distintos y NO deben confundirse:**
  * `product.active` — visibilidad individual de un producto en el catálogo público. El admin puede activar/desactivar cada producto por separado desde `/admin/productos`.
  * `ordersEnabled` (`AppSettings`) — interruptor global que habilita o deshabilita la creación de pedidos en toda la tienda. Se gestiona desde `/admin/ajustes`.

---

## 9. Cómo ejecutar el proyecto

```bash
# Levantar todo con Docker
docker compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
# DB:       localhost:5432

# Migraciones (primera vez o tras cambios en schema)
docker compose exec backend npx prisma migrate dev

# Seed (datos iniciales)
docker compose exec backend npx ts-node prisma/seed.ts

# Tests backend
docker compose exec backend npm test

# Tests frontend
cd frontend && npm test
```

---

## 10. Estado actual del proyecto

### Decisiones tomadas en Fase 5

* **Flujo de pago:** `createOrder` crea el pedido en `PENDING/UNPAID` → `createStripeCheckoutSession` genera la sesión y guarda `stripeCheckoutSessionId` en la Order → frontend hace `window.location.href = sessionUrl` → Stripe redirige a `/pedido/:id?pagado=true` (éxito) o `/checkout?cancelado=true` (cancelación).
* **Fuente de verdad del pago:** el webhook `checkout.session.completed` es el único que actualiza `paymentStatus = PAID` y `status = PROCESSING`. La redirección de éxito solo sirve para informar al usuario.
* **Webhook:** registrado en `app.ts` ANTES de `express.json()` usando `express.raw({ type: 'application/json' })`. El endpoint es `POST /api/payments/stripe/webhook`. Verifica la firma con `stripe.webhooks.constructEvent`.
* **Variables de entorno nuevas (backend):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`. Variable nueva (frontend): `VITE_STRIPE_PUBLISHABLE_KEY` (reservada para uso futuro si se integra Stripe Elements).
* **Cancelación:** si el usuario vuelve de Stripe sin pagar, Stripe redirige a `/checkout?cancelado=true`. El `CheckoutPage` muestra un aviso y mantiene el formulario rellenado con los datos anteriores. El pedido queda en `PENDING/UNPAID` (se puede limpiar con un job futuro).
* **Estado de pago en confirmación:** `OrderConfirmationPage` muestra una pastilla con `paymentStatus` (UNPAID/PAID/FAILED/REFUNDED) y un aviso informativo si viene de `?pagado=true` y el pago aún no se ha confirmado por webhook.
* **Enum `PaymentStatus`:** `UNPAID | PAID | FAILED | REFUNDED`. El campo `paymentStatus` en `Order` tiene default `UNPAID`.

### Decisiones tomadas en Fase 4

* **Dashboard de ventas:** `GET /api/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` — devuelve resumen (ingresos totales de pedidos COMPLETED, ticket medio), desglose por estado, top 10 productos por ingresos y tabla de ingresos por día.
* **Settings admin:** `GET|PUT /api/admin/settings` — gestiona solo `ordersEnabled` (`"true"|"false"`) y `newProductDays` (número en string). Las tarifas de envío siguen gestionadas por `orders.service`.
* **Popup emergente:** `GET /api/popup` (público), `GET|POST /api/popup/admin` y `DELETE /api/popup/admin/:id` (admin). Crear un nuevo popup desactiva todos los anteriores. En frontend, se registra en localStorage la fecha de última dismissal para no volver a mostrar el mismo popup ese día.
* **Desactivación de pedidos:** ya implementada en Fase 2 (`ordersEnabled` en `AppSettings`), ahora el admin tiene UI para activar/desactivar vía toggle en `/admin/ajustes`.
* **Contacto con cliente:** en `/admin/pedidos`, el email del cliente es un enlace `mailto:` con asunto prerellenado que abre el cliente de correo del admin.
* **Rutas admin nuevas:** `/admin/dashboard` (ventas), `/admin/ajustes` (settings + popup). El índice `/admin` redirige a `/admin/dashboard`.

### Decisiones tomadas en Fase 3

* **Registro:** nombre obligatorio + dirección de envío opcional en el formulario de registro.
* **Dirección por defecto:** 6 campos (`addressName`, `addressStreet`, `addressStreet2`, `addressCity`, `addressPostal`, `addressCountry`) directamente en el modelo `User` (1:1, sin tabla separada). Migración: `add_address_to_user`.
* **Checkout autenticado:** campos pre-rellenados desde `user.address*`; checkbox "Actualizar mi dirección de perfil con esta" actualiza `User` vía `saveAddressToProfile: true` en el body del pedido.
* **Historial de pedidos:** `GET /api/orders/my-orders` (requireAuth), página `/mis-pedidos`.
* **Reviews:** solo usuarios autenticados con al menos un pedido `COMPLETED` que incluya el producto pueden reseñar. Una reseña por usuario/producto. Endpoint: `POST /api/products/:productId/reviews`.
* **Menú de usuario en header:** icono de perfil enlaza a `/perfil`; dropdown con "Mi perfil", "Mis pedidos" y "Cerrar sesión" (solo usuarios no admin).
* **Rutas auth públicas:** `/login` y `/registro` fuera del `<Layout />` (sin header de tienda).

### Decisiones tomadas en Fase 2

* **Envío:** Opción A — tabla fija por zona. Tarifas en `AppSettings`: `shipping_peninsular` (4,95 €), `shipping_baleares` (7,95 €), `shipping_canarias` (12,00 €), `shipping_international` (20,00 €).
* **Checkout:** Solo como invitado (guest). El `userId` se adjunta si hay JWT presente (`optionalAuth` middleware).
* **Carrito:** Zustand + `persist` en `localStorage` bajo la clave `bensoneria-cart`. Mismo producto con `asKeychain` distinto = línea separada en el carrito.
* **Rutas públicas:** Envueltas en `<Layout />` que incluye header con logo, menú de usuario y contador del carrito.
* **Endpoint público de tarifas:** `GET /api/orders/shipping-rates` devuelve las 4 zonas con sus precios desde `AppSettings`.
* **Dirección de envío:** `street2` es opcional (`String?` en Prisma).

### Decisiones acordadas para Fase 5

* **Pasarela inicial:** Stripe Checkout.
* **Fuente de verdad del pago:** webhook de Stripe, nunca la redirección del navegador.
* **Modelo:** separar estado logístico (`status`) de estado de pago (`paymentStatus`).
* **Orden del flujo:** crear pedido pendiente antes de redirigir a Stripe.

### Incidencias resueltas en Fase 3

* **Cliente Prisma no regenerado tras migración:** `prisma migrate dev` aplica el SQL pero en el contenedor Docker el cliente puede quedar desactualizado. Solución: `docker compose exec backend npx prisma generate` + reiniciar backend.

### Incidencias resueltas en Fase 2

* **Redirección al carrito vacío tras confirmar pedido:** `clear()` vaciaba el carrito antes de que `navigate` completara, disparando el `useEffect` de guardia. Resuelto con `useRef orderPlaced` que bloquea el redirect cuando el vaciado es intencionado.

### Incidencias resueltas en Fase 1

* **JWT TypeScript TS2769**: `jwt.sign` con `expiresIn` — resuelto con helper `signToken` usando cast `as SignOptions['expiresIn']`
* **PostgreSQL healthcheck**: `pg_isready` sin `-d` conectaba a DB "bensoneria" en lugar de "labensoneria" — añadido `-d ${POSTGRES_DB:-labensoneria}`
* **CORS con credenciales**: `cors()` bare no soporta `Authorization` headers — reemplazado por función `origin` explícita con `credentials: true`
* **Prisma binary targets**: cliente generado en Windows no funciona en contenedor Linux — añadido `binaryTargets = ["native", "debian-openssl-3.0.x"]` en `schema.prisma`
* **Hot reload en Windows/Docker**: inotify no propaga sobre volúmenes montados — solucionado con `CHOKIDAR_USEPOLLING=true`, `--poll` en ts-node-dev y `watch.usePolling` en Vite

> Actualiza esta sección al final de cada sesión de trabajo.
