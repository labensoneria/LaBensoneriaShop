import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as ctrl from '../controllers/auth.controller';

const router = Router();

router.post('/register',          ctrl.register);
router.post('/login',             ctrl.login);
router.get('/me',                 requireAuth, ctrl.me);
router.patch('/me',               requireAuth, ctrl.updateProfile);
router.post('/forgot-password',   ctrl.forgotPassword);
router.post('/reset-password',    ctrl.resetPassword);

export default router;
