import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ordersService from '../services/orders.service';
import { AppError } from '../utils/AppError';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId:         z.string().uuid(),
        quantity:          z.number().int().min(1).max(10),
        asKeychain:        z.boolean().default(false),
        selectedColorHex:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
        selectedColorName: z.string().optional().nullable(),
      })
    )
    .min(1),
  guestEmail:           z.string().email(),
  guestName:            z.string().min(1),
  deliveryType:         z.enum(['HOME', 'PICKUP_POINT']),
  packlinkServiceId:    z.number().int().positive(),
  pickupPointId:        z.string().optional(),
  pickupPointName:      z.string().optional(),
  pickupPointAddress:   z.string().optional(),
  saveAddressToProfile: z.boolean().optional(),
  address: z.object({
    name:       z.string().min(1),
    street:     z.string().min(1),
    street2:    z.string().optional(),
    city:       z.string().min(1),
    postalCode: z.string().min(1),
    country:    z.string().min(1),
  }),
});

const quoteSchema = z.object({
  toCountry: z.string().min(2).max(2),
  toZip:     z.string().min(1),
  items: z
    .array(z.object({
      productId: z.string().uuid(),
      quantity:  z.number().int().min(1).max(10),
    }))
    .min(1),
});

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data   = createOrderSchema.parse(req.body);
    const userId = req.user?.userId;
    const order  = await ordersService.createOrder({ ...data, userId });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await ordersService.getOrder(req.params.id);
    if (!order) throw new AppError('Pedido no encontrado', 404);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function shippingQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = quoteSchema.parse(req.body);
    const quote = await ordersService.quoteForCart(data);
    res.json(quote);
  } catch (err) {
    next(err);
  }
}

export async function pickupPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const carrierId = String(req.query.carrierId ?? '');
    const country   = String(req.query.country   ?? '');
    const zip       = String(req.query.zip       ?? '');
    if (!carrierId || !country || !zip) {
      throw new AppError('Faltan parámetros: carrierId, country, zip', 400);
    }
    console.log(`[pickupPoints] carrierId=${carrierId} country=${country} zip=${zip}`);
    const points = await ordersService.listPickupPoints(carrierId, country, zip);
    console.log(`[pickupPoints] returned ${points.length} points`);
    res.json(points);
  } catch (err) {
    console.error('[pickupPoints] error:', err);
    next(err);
  }
}

export async function availability(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await ordersService.getOrdersAvailability());
  } catch (err) {
    next(err);
  }
}

export async function myOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await ordersService.getUserOrders(req.user!.userId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
}
