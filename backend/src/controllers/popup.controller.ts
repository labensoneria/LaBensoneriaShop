import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as popupService from '../services/popup.service';

const createSchema = z.object({
  content: z.string().min(1).max(500),
});

export async function getActive(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const popup = await popupService.getActivePopup();
    res.json(popup ?? null);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content } = createSchema.parse(req.body);
    res.status(201).json(await popupService.createPopup(content));
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await popupService.deactivatePopup(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await popupService.listPopups());
  } catch (err) {
    next(err);
  }
}
