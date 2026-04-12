import { Router } from 'express';
import * as ctrl from '../controllers/adminOrders.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/',            requireAdmin, ctrl.list);
router.put('/:id/status',  requireAdmin, ctrl.updateStatus);

export default router;
