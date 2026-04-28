import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import * as adminOrdersService from '../services/adminOrders.service';

const listQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).optional(),
  limit:  z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED']).optional(),
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED']),
  replenishStock: z.record(z.string(), z.number().int().min(0)).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, status } = listQuerySchema.parse(req.query);
    res.json(await adminOrdersService.listOrders(page, limit, status as OrderStatus | undefined));
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, replenishStock } = statusSchema.parse(req.body);
    const order = await adminOrdersService.updateOrderStatus(req.params.id, status as OrderStatus, replenishStock);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
