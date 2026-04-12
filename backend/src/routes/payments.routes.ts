import { Router } from 'express';
import * as ctrl from '../controllers/payments.controller';

const router = Router();

// Crea una sesión de Stripe Checkout y devuelve la URL de pago
router.post('/stripe/checkout-session', ctrl.createSession);

export default router;
