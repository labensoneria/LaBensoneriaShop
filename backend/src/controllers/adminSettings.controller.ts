import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as adminSettingsService from '../services/adminSettings.service';

const updateSchema = z.object({
  ordersEnabled:  z.enum(['true', 'false']).optional(),
  newProductDays: z.coerce.number().int().min(1).max(365).optional()
    .transform((v) => v !== undefined ? String(v) : undefined),
});

export async function getPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await adminSettingsService.getSettings();
    res.json({ newProductDays: parseInt(settings.newProductDays, 10) });
  } catch (err) {
    next(err);
  }
}

export async function get(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await adminSettingsService.getSettings());
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateSchema.parse(req.body);
    const data: Record<string, string> = {};
    if (parsed.ordersEnabled  !== undefined) data.ordersEnabled  = parsed.ordersEnabled;
    if (parsed.newProductDays !== undefined) data.newProductDays = parsed.newProductDays;
    res.json(await adminSettingsService.updateSettings(data));
  } catch (err) {
    next(err);
  }
}
