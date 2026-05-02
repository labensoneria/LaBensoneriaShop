import { Resend } from 'resend';
import prisma from '../utils/prisma';

const resend = new Resend(process.env.RESEND_API_KEY ?? 're_dev_placeholder');
const FROM        = process.env.RESEND_FROM_EMAIL ?? 'noreply@labensoneria.xyz';
const DEV         = process.env.NODE_ENV !== 'production';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://labensoneria.xyz';
const BANNER_HTML  = `<a href="${FRONTEND_URL}" style="display:block;"><img src="${FRONTEND_URL}/img/Top_Page.jpg" alt="La Bensonería" width="560" style="display:block;width:100%;max-width:560px;border:0;" /></a>`;

async function send(payload: Parameters<typeof resend.emails.send>[0]): Promise<void> {
  if (DEV) {
    console.log('[email:dev] Would send email:', JSON.stringify({ to: payload.to, subject: payload.subject }, null, 2));
    return;
  }
  await resend.emails.send(payload);
}

// ─── Order Confirmation ───────────────────────────────────────────────────────

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
      address: true,
      user:    { select: { email: true, name: true } },
    },
  });

  if (!order) return;

  const recipientEmail = order.user?.email ?? order.guestEmail;
  const recipientName  = order.user?.name  ?? order.guestName ?? 'Cliente';
  if (!recipientEmail) return;

  const orderUrl = `${FRONTEND_URL}/pedido/${order.id}`;

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4da;">${item.product.name}${item.asKeychain ? ' (llavero)' : ''}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4da;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e8e4da;text-align:right;">${(parseFloat(item.unitPrice.toString()) * item.quantity).toFixed(2)} €</td>
        </tr>`,
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FAF7F0;font-family:Georgia,serif;color:#2C3E2D;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    ${BANNER_HTML}

    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#2C3E2D;">¡Gracias por tu pedido, ${recipientName}!</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
        Tu pago ha sido confirmado. Estamos preparando tu pedido con mucho cuidado.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#2C3E2D;">
        <thead>
          <tr>
            <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #4A7C59;color:#4A7C59;">Producto</th>
            <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #4A7C59;color:#4A7C59;">Ud.</th>
            <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #4A7C59;color:#4A7C59;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:8px 0;text-align:right;color:#555;">Subtotal</td>
            <td style="padding:8px 0;text-align:right;">${parseFloat(order.subtotal.toString()).toFixed(2)} €</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:4px 0;text-align:right;color:#555;">Envío</td>
            <td style="padding:4px 0;text-align:right;">${parseFloat(order.shippingCost.toString()).toFixed(2)} €</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:8px 0;text-align:right;font-weight:bold;border-top:2px solid #4A7C59;">Total</td>
            <td style="padding:8px 0;text-align:right;font-weight:bold;border-top:2px solid #4A7C59;">${parseFloat(order.total.toString()).toFixed(2)} €</td>
          </tr>
        </tfoot>
      </table>

      ${order.address ? `
      <div style="margin:24px 0 0;padding:16px;background:#FAF7F0;border-radius:6px;font-size:13px;line-height:1.7;">
        <strong style="color:#4A7C59;">Dirección de entrega</strong><br />
        ${order.address.name}<br />
        ${order.address.street}${order.address.street2 ? ', ' + order.address.street2 : ''}<br />
        ${order.address.postalCode} ${order.address.city}<br />
        ${order.address.country}
      </div>` : ''}

      <div style="margin:28px 0 0;text-align:center;">
        <a href="${orderUrl}" style="display:inline-block;background:#4A7C59;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;letter-spacing:.3px;">
          Ver mi pedido
        </a>
      </div>
    </div>

    <div style="padding:20px 40px;border-top:1px solid #e8e4da;font-size:12px;color:#999;text-align:center;">
      La Bensonería · labensoneria.xyz<br />
      Si tienes alguna duda, responde a este correo.
    </div>
  </div>
</body>
</html>`;

  await send({
    from:    FROM,
    to:      recipientEmail,
    subject: `Pedido confirmado #${order.id.slice(0, 8).toUpperCase()}`,
    html,
  });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#FAF7F0;font-family:Georgia,serif;color:#2C3E2D;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    ${BANNER_HTML}

    <div style="padding:32px 40px;">
      <h2 style="margin:0 0 8px;font-size:18px;color:#2C3E2D;">Restablecer contraseña</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.6;">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.<br />
        Haz clic en el botón de abajo. El enlace caduca en <strong>1 hora</strong>.
      </p>

      <div style="margin:0 0 24px;text-align:center;">
        <a href="${resetUrl}" style="display:inline-block;background:#4A7C59;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;letter-spacing:.3px;">
          Restablecer contraseña
        </a>
      </div>

      <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
        Si no has solicitado este cambio, ignora este correo. Tu contraseña no se modificará.<br /><br />
        Si el botón no funciona, copia este enlace en tu navegador:<br />
        <a href="${resetUrl}" style="color:#4A7C59;word-break:break-all;">${resetUrl}</a>
      </p>
    </div>

    <div style="padding:20px 40px;border-top:1px solid #e8e4da;font-size:12px;color:#999;text-align:center;">
      La Bensonería · labensoneria.xyz
    </div>
  </div>
</body>
</html>`;

  await send({
    from:    FROM,
    to:      email,
    subject: 'Restablece tu contraseña — La Bensonería',
    html,
  });
}
