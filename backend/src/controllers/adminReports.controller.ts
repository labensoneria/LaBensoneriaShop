import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as adminReportsService from '../services/adminReports.service';

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = querySchema.parse(req.query);
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate   = new Date(`${to}T23:59:59.999Z`);
    res.json(await adminReportsService.getSalesReport(fromDate, toDate));
  } catch (err) {
    next(err);
  }
}
