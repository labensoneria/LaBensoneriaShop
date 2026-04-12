import { Request, Response, NextFunction } from 'express';
import * as service from '../services/payments.service';

export async function createSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body as { orderId: string };
    if (!orderId) {
      res.status(400).json({ error: 'orderId es obligatorio' });
      return;
    }
    const result = await service.createCheckoutSession(orderId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      res.status(400).json({ error: 'Falta la firma stripe-signature' });
      return;
    }
    await service.handleWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
