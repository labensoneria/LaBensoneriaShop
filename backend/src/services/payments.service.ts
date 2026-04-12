import Stripe from 'stripe';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { sendOrderConfirmation } from './email.service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

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
          unit_amount: Math.round(parseFloat(item.unitPrice.toString()) * 100),
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: 'eur',
          product_data: { name: 'Gastos de envío' },
          unit_amount: Math.round(parseFloat(order.shippingCost.toString()) * 100),
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
