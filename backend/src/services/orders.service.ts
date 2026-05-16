import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { computeEffectivePrice } from './products.service';
import * as packlink from './packlink.service';

export type DeliveryType = 'HOME' | 'PICKUP_POINT';

export async function getOrdersAvailability(): Promise<{ ordersEnabled: boolean }> {
  const setting = await prisma.appSettings.findUnique({
    where: { key: 'ordersEnabled' },
  });

  return { ordersEnabled: setting?.value !== 'false' };
}

interface OrderItemInput {
  productId: string;
  quantity:  number;
  asKeychain: boolean;
  selectedColorHex?:  string | null;
  selectedColorName?: string | null;
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
  address:              AddressInput;
  deliveryType:         DeliveryType;
  packlinkServiceId:    number;
  pickupPointId?:       string;
  pickupPointName?:     string;
  pickupPointAddress?:  string;
  userId?:              string;
  saveAddressToProfile?: boolean;
}

export async function quoteForCart(input: {
  toCountry: string;
  toZip:     string;
  items:     Array<{ productId: string; quantity: number }>;
}) {
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where:  { id: { in: ids }, active: true },
    select: { id: true, weightGrams: true },
  });
  if (products.length !== ids.length) {
    throw new AppError('Uno o más productos no están disponibles', 400);
  }
  const weightMap = new Map(products.map((p) => [p.id, p.weightGrams]));
  const weighted  = input.items.map((i) => ({
    weightGrams: weightMap.get(i.productId)!,
    quantity:    i.quantity,
  }));
  const pkg = packlink.buildPackage(weighted);
  return packlink.quoteShipping({
    toCountry: input.toCountry,
    toZip:     input.toZip,
    packages:  [pkg],
  });
}

export async function listPickupPoints(carrierId: string, country: string, zip: string) {
  return packlink.getPickupPoints(carrierId, country, zip);
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
    include: { colors: true },
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
    if (product.colors.length > 0) {
      if (!item.selectedColorHex) {
        throw new AppError(`Debes elegir un color para "${product.name}"`, 400);
      }
      const match = product.colors.find((c) => c.hex.toLowerCase() === item.selectedColorHex!.toLowerCase());
      if (!match) {
        throw new AppError(`El color seleccionado no está disponible para "${product.name}"`, 400);
      }
      // Normalizar el nombre desde la DB (no fiarse del cliente)
      item.selectedColorHex  = match.hex;
      item.selectedColorName = match.name;
    } else if (item.selectedColorHex) {
      throw new AppError(`"${product.name}" no tiene variantes de color`, 400);
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

  // Re-cotizar el envío con Packlink (no confiar en el precio del cliente)
  const pkg = packlink.buildPackage(
    input.items.map((i) => ({ weightGrams: productMap.get(i.productId)!.weightGrams, quantity: i.quantity })),
  );
  const quote = await packlink.quoteShipping({
    toCountry: input.address.country,
    toZip:     input.address.postalCode,
    packages:  [pkg],
  });
  const allServices = [...quote.home, ...quote.pickup];
  const matched = allServices.find((s) => s.serviceId === input.packlinkServiceId);
  if (!matched) {
    throw new AppError('El método de envío seleccionado ya no está disponible. Recarga el checkout.', 400);
  }
  const expectsDropoff = input.deliveryType === 'PICKUP_POINT';
  if (matched.dropoff !== expectsDropoff) {
    throw new AppError('El método de envío no coincide con el tipo de entrega seleccionado.', 400);
  }
  if (expectsDropoff && (!input.pickupPointId || !input.pickupPointName)) {
    throw new AppError('Selecciona un punto de recogida.', 400);
  }

  const shippingCost = matched.priceTotal;
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
      deliveryType:         input.deliveryType,
      packlinkServiceId:    matched.serviceId,
      packlinkCarrierName:  matched.carrierName,
      packlinkServiceName:  matched.serviceName,
      pickupPointId:        expectsDropoff ? input.pickupPointId      ?? null : null,
      pickupPointName:      expectsDropoff ? input.pickupPointName    ?? null : null,
      pickupPointAddress:   expectsDropoff ? input.pickupPointAddress ?? null : null,
      items: {
        create: input.items.map((item) => ({
          productId:         item.productId,
          quantity:          item.quantity,
          asKeychain:        item.asKeychain,
          unitPrice:         unitPrices.get(item.productId)!,
          selectedColorHex:  item.selectedColorHex ?? null,
          selectedColorName: item.selectedColorName ?? null,
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
