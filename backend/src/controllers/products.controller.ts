import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as productsService from '../services/products.service';
import { AppError } from '../utils/AppError';

const listQuerySchema = z.object({
  sort: z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'popular']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sort, page, limit } = listQuerySchema.parse(req.query);
    const result = await productsService.listProducts(sort, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productsService.getProduct(req.params.id);
    if (!product) throw new AppError('Producto no encontrado', 404);
    res.json(product);
  } catch (err) {
    next(err);
  }
}
