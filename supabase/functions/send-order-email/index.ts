// Supabase Edge Function — send-order-email
// Deploy: supabase functions deploy send-order-email
// Secrets: RESEND_API_KEY, FROM_EMAIL, APP_URL, BUSINESS_NAME

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { brandedEmail, sendBrandedEmail, EMAIL_BRAND } from '../_shared/email.ts';

type EmailEvent = 'order.confirmed' | 'order.out_for_delivery' | 'order.delivered';

interface OrderSummary {
  id: string;
  animalType: string;
  quantity: number;
  skinOption: string;
  shares: number;
  pricing: { totalPrice: number; perShareAmount: number };
  deliveryAddress: string;
  deliveryDate: string;
  deliveryWindow: string;
  paymentMethod: string;
  subscriptionInterval?: number;
}

interface EmailRequest {
  event: EmailEvent;
  to?: string;            // fallback recipient; prefer resolving from userId
  userId?: string;        // order owner — email is resolved server-side from this
  customerName: string;
  order: OrderSummary;
}

function buildEmailContent(event: EmailEvent, customerName: string, order: OrderSummary): { subject: string; html: string } {
  const skinLabel = order.skinOption === 'BURNT' ? 'Skin Burnt' : 'Standard Skinning';
  const recurring = order.subscriptionInterval
    ? `<p style="margin:0 0 8px"><strong>Recurring:</strong> Every ${order.subscriptionInterval} month${order.subscriptionInterval > 1 ? 's' : ''}</p>`
    : '';

  const orderBlock = `
    <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:20px 0;font-size:14px;color:#334155">
      <p style="margin:0 0 8px"><strong>Order ID:</strong> ${order.id}</p>
      <p style="margin:0 0 8px"><strong>Animal:</strong> ${order.quantity}× ${order.animalType} (${skinLabel})</p>
      <p style="margin:0 0 8px"><strong>Total:</strong> $${order.pricing.totalPrice.toFixed(2)}${order.shares > 1 ? ` (your share: $${order.pricing.perShareAmount.toFixed(2)})` : ''}</p>
      <p style="margin:0 0 8px"><strong>Payment:</strong> ${order.paymentMethod}</p>
      <p style="margin:0 0 8px"><strong>Delivery:</strong> ${order.deliveryDate} · ${order.deliveryWindow}</p>
      <p style="margin:0 0 8px"><strong>Address:</strong> ${order.deliveryAddress}</p>
      ${recurring}
    </div>`;

  const cta = { label: 'Track Your Order', url: `${EMAIL_BRAND.APP_URL}/track` };

  const copy: Record<EmailEvent, { subject: string; heading: string; intro: string }> = {
    'order.confirmed': {
      subject: `Order Confirmed — ${order.id}`,
      heading: 'Your order is confirmed!',
      intro: `Great news — your order has been confirmed and is being prepared. We'll notify you when it's on its way.`,
    },
    'order.out_for_delivery': {
      subject: `Out for Delivery — ${order.id}`,
      heading: 'Your order is on its way!',
      intro: `Your order is out for delivery and will arrive during your selected window. Please be available at the address below.`,
    },
    'order.delivered': {
      subject: `Delivered — ${order.id}`,
      heading: 'Your order has been delivered!',
      intro: `Your order has been delivered. Enjoy your meal! If you have any questions, reply to this email.`,
    },
  };

  const c = copy[event];
  const html = brandedEmail({
    heading: c.heading,
    greetingName: customerName,
    bodyHtml: `<p style="margin:0 0 16px;color:#334155;font-size:14px">${c.intro}</p>${orderBlock}`,
    cta,
  });
  return { subject: c.subject, html };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Verify the caller is an authenticated Supabase user
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  try {
    const body: EmailRequest = await req.json();
    const { event, to, userId, customerName, order } = body;

    // Resolve the actual order owner server-side so the email reaches the
    // customer even when an admin triggers the status change.
    let recipientEmail = to ?? '';
    let recipientName = customerName;
    if (userId) {
      const { data: cust } = await supabase.auth.admin.getUserById(userId);
      if (cust?.user?.email) {
        recipientEmail = cust.user.email;
        recipientName = (cust.user.user_metadata?.full_name as string) ?? cust.user.email.split('@')[0] ?? recipientName;
      }
    }

    if (!event || !recipientEmail || !order) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    const { subject, html } = buildEmailContent(event, recipientName, order);
    const result = await sendBrandedEmail(recipientEmail, subject, html);
    if (!result.ok && !result.skipped) {
      return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 502, headers });
    }
    return new Response(JSON.stringify({ ok: true, skipped: result.skipped ?? false }), { headers });
  } catch (err) {
    console.error('[send-order-email]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
