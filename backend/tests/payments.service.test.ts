// Variables prefixed with "mock" can be referenced inside jest.mock() factories (Jest hoisting exception)
const mockStripeCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockStripeCreate } },
    webhooks:  { constructEvent: mockConstructEvent },
  }))
);

jest.mock('../src/utils/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
      update:     jest.fn(),
    },
  },
}));

import { createCheckoutSession, handleWebhook } from '../src/services/payments.service';
import prisma from '../src/utils/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const mockOrder = {
  id:            'order-1',
  paymentStatus: 'UNPAID',
  shippingCost:  '4.95',
  guestEmail:    'cliente@test.com',
  items: [
    {
      product:   { name: 'Peluche Conejito' },
      asKeychain: false,
      unitPrice: '22.00',
      quantity:  1,
    },
  ],
};

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

describe('createCheckoutSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 404 when order does not exist', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(createCheckoutSession('no-existe')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('throws 400 when order is already paid', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue({
      ...mockOrder,
      paymentStatus: 'PAID',
    });

    await expect(createCheckoutSession('order-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('creates a Stripe session and returns sessionUrl', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    mockStripeCreate.mockResolvedValue({
      id:  'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    const result = await createCheckoutSession('order-1');

    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'payment', metadata: { orderId: 'order-1' } })
    );
    expect(result.sessionUrl).toBe('https://checkout.stripe.com/pay/cs_test_123');
  });

  it('saves stripeCheckoutSessionId on the order', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    mockStripeCreate.mockResolvedValue({ id: 'cs_test_456', url: 'https://stripe.com/pay' });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    await createCheckoutSession('order-1');

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stripeCheckoutSessionId: 'cs_test_456' } })
    );
  });

  it('includes shipping cost as a separate line item', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    mockStripeCreate.mockResolvedValue({ id: 'cs_test_789', url: 'https://stripe.com/pay' });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    await createCheckoutSession('order-1');

    const lineItems: { price_data: { product_data: { name: string }; unit_amount: number } }[] =
      mockStripeCreate.mock.calls[0][0].line_items;

    const shippingLine = lineItems.find(
      (li) => li.price_data.product_data.name === 'Gastos de envío'
    );
    expect(shippingLine).toBeDefined();
    expect(shippingLine!.price_data.unit_amount).toBe(495); // 4.95 € → 495 cents
  });

  it('converts product unitPrice to cents correctly', async () => {
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
    mockStripeCreate.mockResolvedValue({ id: 'cs_x', url: 'https://stripe.com' });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    await createCheckoutSession('order-1');

    const lineItems: { price_data: { product_data: { name: string }; unit_amount: number } }[] =
      mockStripeCreate.mock.calls[0][0].line_items;

    const productLine = lineItems.find(
      (li) => li.price_data.product_data.name === 'Peluche Conejito'
    );
    expect(productLine!.price_data.unit_amount).toBe(2200); // 22.00 € → 2200 cents
  });

  it('appends "(llavero)" to product name when asKeychain is true', async () => {
    const keychainOrder = {
      ...mockOrder,
      items: [{ ...mockOrder.items[0], asKeychain: true }],
    };
    (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(keychainOrder);
    mockStripeCreate.mockResolvedValue({ id: 'cs_kc', url: 'https://stripe.com' });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    await createCheckoutSession('order-1');

    const lineItems: { price_data: { product_data: { name: string } } }[] =
      mockStripeCreate.mock.calls[0][0].line_items;

    expect(lineItems[0].price_data.product_data.name).toContain('(llavero)');
  });
});

// ---------------------------------------------------------------------------
// handleWebhook
// ---------------------------------------------------------------------------

describe('handleWebhook', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws 400 for an invalid Stripe signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    await expect(
      handleWebhook(Buffer.from('{}'), 'bad-sig')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('updates order to PAID/PROCESSING on checkout.session.completed', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata:       { orderId: 'order-1' },
          payment_intent: 'pi_abc123',
          currency:       'eur',
          amount_total:   2695,
        },
      },
    });
    (mockPrisma.order.update as jest.Mock).mockResolvedValue({});

    await handleWebhook(Buffer.from('{}'), 'valid-sig');

    expect(mockPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: expect.objectContaining({
          paymentStatus:         'PAID',
          status:                'PROCESSING',
          paymentProvider:       'stripe',
          stripePaymentIntentId: 'pi_abc123',
          paymentCurrency:       'eur',
          paymentAmount:         26.95,
        }),
      })
    );
  });

  it('does not update the order for unhandled event types', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    });

    await handleWebhook(Buffer.from('{}'), 'valid-sig');

    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it('does nothing when checkout.session.completed has no orderId in metadata', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: {} } },
    });

    await handleWebhook(Buffer.from('{}'), 'valid-sig');

    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });
});
