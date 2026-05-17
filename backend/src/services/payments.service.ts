import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { sendOrderConfirmation } from './email.service';

const MOCK = process.env.MOCK_STRIPE === 'true';
if (MOCK && process.env.NODE_ENV === 'production') {
  throw new Error('MOCK_STRIPE must not be enabled in production');
}
if (MOCK) console.log('[stripe] MOCK MODE — orders will be marked PAID without real payment');

const stripe = MOCK
  ? (null as unknown as Stripe)
  : new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

export async function createCheckoutSession(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { name: true } } },
      },
    },
  });

  if (!order) throw new AppError('Pedido no encontrado', 404);
  if (order.paymentStatus === 'PAID') throw new AppError('Este pedido ya está pagado', 400);

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  if (MOCK) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus:         'PAID',
        status:                'PROCESSING',
        paymentProvider:       'mock',
        stripeCheckoutSessionId: `mock_cs_${orderId}`,
        paidAt:                new Date(),
        paymentCurrency:       'eur',
        paymentAmount:         Number.parseFloat(order.total.toString()),
      },
    });
    return { sessionUrl: `${frontendUrl}/pedido/${orderId}?pagado=true` };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      ...order.items.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `${item.product.name}${item.asKeychain ? ' (llavero)' : ''}`,
          },
          unit_amount: Math.round(Number.parseFloat(item.unitPrice.toString()) * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: 'eur',
          product_data: { name: 'Gastos de envío' },
          unit_amount: Math.round(Number.parseFloat(order.shippingCost.toString()) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: order.id },
    success_url: `${frontendUrl}/pedido/${order.id}?pagado=true`,
    cancel_url: `${frontendUrl}/checkout?cancelado=true`,
    customer_email: order.guestEmail ?? undefined,
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { sessionUrl: session.url! };
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  if (MOCK) return; // mock mode already marked the order paid in createCheckoutSession
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw new AppError('Firma del webhook inválida', 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus:          'PAID',
        status:                 'PROCESSING',
        paymentProvider:        'stripe',
        stripePaymentIntentId:  typeof session.payment_intent === 'string'
                                  ? session.payment_intent
                                  : null,
        paidAt:                 new Date(),
        paymentCurrency:        session.currency ?? 'eur',
        paymentAmount:          session.amount_total != null
                                  ? session.amount_total / 100
                                  : null,
      },
    });

    // Fire-and-forget — a failed email must not break the webhook response
    sendOrderConfirmation(orderId).catch((err) =>
      console.error('[email] Order confirmation failed:', err),
    );
  }
}
