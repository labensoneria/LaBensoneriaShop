import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as adminService from '../services/adminProducts.service';

const listQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const createSchema = z.object({
  name:                 z.string().min(1),
  description:          z.string().min(1),
  price:                z.coerce.number().positive(),
  convertibleToKeychain: z.boolean().optional(),
  stock:                z.number().int().min(0).nullable().optional(),
});

const updateSchema = createSchema.partial().extend({
  active: z.boolean().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = listQuerySchema.parse(req.query);
    res.json(await adminService.listAllProducts(page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await adminService.getProductById(req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createSchema.parse(req.body);
    const product = await adminService.createProduct(data);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateSchema.parse(req.body);
    const product = await adminService.updateProduct(req.params.id, data);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminService.deactivateProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminService.deleteProductImage(req.params.id, req.params.imageId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function permanentDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminService.deleteProductPermanently(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = req.files as Express.Multer.File[];
    const product = await adminService.addProductImages(req.params.id, files ?? []);
    res.json(product);
  } catch (err) {
    next(err);
  }
}
