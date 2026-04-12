import { Router } from 'express';
import * as ctrl from '../controllers/orders.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/availability',   ctrl.availability);
router.get('/shipping-rates', ctrl.shippingRates);
router.get('/my-orders',      requireAuth, ctrl.myOrders);
router.post('/',              optionalAuth, ctrl.create);
router.get('/:id',            ctrl.getOne);

export default router;
