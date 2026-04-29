import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { computeEffectivePrice } from './products.service';

export type ShippingZone = 'peninsular' | 'baleares' | 'canarias' | 'international';

const SHIPPING_KEYS: Record<ShippingZone, string> = {
  peninsular:    'shipping_peninsular',
  baleares:      'shipping_baleares',
  canarias:      'shipping_canarias',
  international: 'shipping_international',
};

export const SHIPPING_ZONE_LABELS: Record<ShippingZone, string> = {
  peninsular:    'España peninsular y Portugal',
  baleares:      'Islas Baleares',
  canarias:      'Islas Canarias, Ceuta y Melilla',
  international: 'Internacional',
};

export async function getOrdersAvailability(): Promise<{ ordersEnabled: boolean }> {
  const setting = await prisma.appSettings.findUnique({
    where: { key: 'ordersEnabled' },
  });

  return { ordersEnabled: setting?.value !== 'false' };
}

async function getShippingCost(zone: ShippingZone): Promise<number> {
  const setting = await prisma.appSettings.findUnique({
    where: { key: SHIPPING_KEYS[zone] },
  });
  if (!setting) throw new AppError('Zona de envío no configurada', 500);
  return parseFloat(setting.value);
}

export async function getShippingRates(): Promise<Record<ShippingZone, number>> {
  const keys = Object.values(SHIPPING_KEYS);
  const settings = await prisma.appSettings.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(settings.map((s) => [s.key, parseFloat(s.value)]));
  return {
    peninsular:    map[SHIPPING_KEYS.peninsular]    ?? 4.95,
    baleares:      map[SHIPPING_KEYS.baleares]      ?? 7.95,
    canarias:      map[SHIPPING_KEYS.canarias]      ?? 12.00,
    international: map[SHIPPING_KEYS.international] ?? 20.00,
  };
}

interface OrderItemInput {
  productId: string;
  quantity:  number;
  asKeychain: boolean;
}

interface AddressInput {
  name:       string;
  street:     string;
  street2?:   string;
  city:       string;
  postalCode: string;
  country:    string;
}

export interface CreateOrderInput {
  items:                OrderItemInput[];
  guestEmail:           string;
  guestName:            string;
  shippingZone:         ShippingZone;
  address:              AddressInput;
  userId?:              string;
  saveAddressToProfile?: boolean;
}

export async function createOrder(input: CreateOrderInput) {
  // Verificar si los pedidos están habilitados
  const enabled = await prisma.appSettings.findUnique({ where: { key: 'ordersEnabled' } });
  if (enabled?.value === 'false') {
    throw new AppError('Los pedidos están temporalmente desactivados', 503);
  }

  // Validar productos
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== productIds.length) {
    throw new AppError('Uno o más productos no están disponibles', 400);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    if (item.asKeychain && !product.convertibleToKeychain) {
      throw new AppError(`"${product.name}" no está disponible en versión llavero`, 400);
    }
    if (product.stock !== null) {
      if (product.stock === 0) {
        throw new AppError(`"${product.name}" está agotado`, 409);
      }
      if (product.stock < item.quantity) {
        throw new AppError(`Stock insuficiente para "${product.name}" (disponible: ${product.stock})`, 409);
      }
    }
  }

  // Calcular importes (el precio siempre viene de la DB, nunca del cliente)
  const globalDiscountSetting = await prisma.appSettings.findUnique({ where: { key: 'globalDiscountPercent' } });
  const globalPct = globalDiscountSetting ? (parseInt(globalDiscountSetting.value, 10) || 0) : 0;

  let subtotal = 0;
  const unitPrices = new Map<string, number>();
  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    const rawPrice = parseFloat(product.price.toString());
    const { effectivePrice } = computeEffectivePrice(rawPrice, product.discountPercent, globalPct);
    const unitPrice = parseFloat(effectivePrice);
    unitPrices.set(item.productId, unitPrice);
    subtotal += unitPrice * item.quantity;
  }

  const shippingCost = await getShippingCost(input.shippingZone);
  const total = subtotal + shippingCost;

  // Crear pedido
  const order = await prisma.order.create({
    data: {
      guestEmail:   input.guestEmail,
      guestName:    input.guestName,
      userId:       input.userId ?? null,
      subtotal,
      shippingCost,
      total,
      items: {
        create: input.items.map((item) => ({
          productId:  item.productId,
          quantity:   item.quantity,
          asKeychain: item.asKeychain,
          unitPrice:  unitPrices.get(item.productId)!,
        })),
      },
      address: { create: input.address },
    },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, images: { orderBy: { order: 'asc' }, take: 1 } },
          },
        },
      },
      address: true,
    },
  });

  // Incrementar contadores de ventas y decrementar stock si aplica
  for (const item of input.items) {
    const product = productMap.get(item.productId)!;
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        soldCount: { increment: item.quantity },
        ...(product.stock !== null ? { stock: { decrement: item.quantity } } : {}),
      },
    });
  }

  // Guardar dirección en el perfil del usuario si se solicita
  if (input.userId && input.saveAddressToProfile) {
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        addressName:    input.address.name,
        addressStreet:  input.address.street,
        addressStreet2: input.address.street2 ?? null,
        addressCity:    input.address.city,
        addressPostal:  input.address.postalCode,
        addressCountry: input.address.country,
      },
    });
  }

  return order;
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, images: { orderBy: { order: 'asc' }, take: 1 } },
          },
        },
      },
      address: true,
    },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, images: { orderBy: { order: 'asc' }, take: 1 } },
          },
        },
      },
      address: true,
    },
  });
}
