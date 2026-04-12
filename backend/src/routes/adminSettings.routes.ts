import { Router } from 'express';
import * as ctrl from '../controllers/adminSettings.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/public', ctrl.getPublic);
router.get('/',  requireAdmin, ctrl.get);
router.put('/',  requireAdmin, ctrl.update);

export default router;
