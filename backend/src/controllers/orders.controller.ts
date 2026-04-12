import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as ordersService from '../services/orders.service';
import { AppError } from '../utils/AppError';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId:  z.string().uuid(),
        quantity:   z.number().int().min(1).max(10),
        asKeychain: z.boolean().default(false),
      })
    )
    .min(1),
  guestEmail:           z.string().email(),
  guestName:            z.string().min(1),
  shippingZone:         z.enum(['peninsular', 'baleares', 'canarias', 'international']),
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

export async function shippingRates(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rates = await ordersService.getShippingRates();
    res.json(rates);
  } catch (err) {
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
