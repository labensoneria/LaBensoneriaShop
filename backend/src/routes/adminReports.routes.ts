import { Router } from 'express';
import * as ctrl from '../controllers/adminReports.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', requireAdmin, ctrl.get);

export default router;
