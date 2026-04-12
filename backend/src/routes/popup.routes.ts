import { Router } from 'express';
import * as ctrl from '../controllers/popup.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', ctrl.getActive);

// Admin
router.get('/admin',      requireAdmin, ctrl.list);
router.post('/admin',     requireAdmin, ctrl.create);
router.delete('/admin/:id', requireAdmin, ctrl.deactivate);

export default router;
