import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/reviews.controller';

const router = Router({ mergeParams: true });

router.get('/',  ctrl.listByProduct);
router.post('/', requireAuth, ctrl.create);

export default router;
