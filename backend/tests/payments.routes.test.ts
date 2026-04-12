import request from 'supertest';
import app from '../src/app';
import { AppError } from '../src/utils/AppError';

jest.mock('../src/services/payments.service', () => ({
  createCheckoutSession: jest.fn(),
  handleWebhook:         jest.fn(),
}));

import * as paymentsService from '../src/services/payments.service';

// ---------------------------------------------------------------------------
// POST /api/payments/stripe/checkout-session
// ---------------------------------------------------------------------------

describe('POST /api/payments/stripe/checkout-session', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with sessionUrl on success', async () => {
    (paymentsService.createCheckoutSession as jest.Mock).mockResolvedValue({
      sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    const res = await request(app)
      .post('/api/payments/stripe/checkout-session')
      .send({ orderId: 'order-1' });

    expect(res.status).toBe(200);
    expect(res.body.sessionUrl).toBe('https://checkout.stripe.com/pay/cs_test_123');
    expect(paymentsService.createCheckoutSession).toHaveBeenCalledWith('order-1');
  });

  it('returns 400 when orderId is missing', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/checkout-session')
      .send({});

    expect(res.status).toBe(400);
    expect(paymentsService.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('propagates 404 from service when order does not exist', async () => {
    (paymentsService.createCheckoutSession as jest.Mock).mockRejectedValue(
      new AppError('Pedido no encontrado', 404)
    );

    const res = await request(app)
      .post('/api/payments/stripe/checkout-session')
      .send({ orderId: 'no-existe' });

    expect(res.status).toBe(404);
  });

  it('propagates 400 from service when order is already paid', async () => {
    (paymentsService.createCheckoutSession as jest.Mock).mockRejectedValue(
      new AppError('Este pedido ya está pagado', 400)
    );

    const res = await request(app)
      .post('/api/payments/stripe/checkout-session')
      .send({ orderId: 'order-paid' });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/stripe/webhook
// ---------------------------------------------------------------------------

describe('POST /api/payments/stripe/webhook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send('{}');

    expect(res.status).toBe(400);
    expect(paymentsService.handleWebhook).not.toHaveBeenCalled();
  });

  it('returns { received: true } on valid webhook', async () => {
    (paymentsService.handleWebhook as jest.Mock).mockResolvedValue(undefined);

    const res = await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'valid-sig')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  it('propagates 400 from service on invalid signature', async () => {
    (paymentsService.handleWebhook as jest.Mock).mockRejectedValue(
      new AppError('Firma del webhook inválida', 400)
    );

    const res = await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send('{}');

    expect(res.status).toBe(400);
  });

  it('passes the raw body buffer to the service', async () => {
    (paymentsService.handleWebhook as jest.Mock).mockResolvedValue(undefined);

    await request(app)
      .post('/api/payments/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 'test-sig')
      .send('{"type":"checkout.session.completed"}');

    const [rawBody, sig] = (paymentsService.handleWebhook as jest.Mock).mock.calls[0];
    expect(Buffer.isBuffer(rawBody)).toBe(true);
    expect(sig).toBe('test-sig');
  });
});
