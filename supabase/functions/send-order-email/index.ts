// Supabase Edge Function — send-order-email
// Deploy: supabase functions deploy send-order-email
// Secrets: supabase secrets set RESEND_API_KEY=re_... FROM_EMAIL=noreply@yourdomain.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

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
  to: string;
  customerName: string;
  order: OrderSummary;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'orders@halalmeatco.com';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://halalmeatco.com';

function buildEmailContent(event: EmailEvent, customerName: string, order: OrderSummary): { subject: string; html: string } {
  const first = customerName.split(' ')[0] || 'there';
  const orderUrl = `${APP_URL}/#/track`;
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

  const trackBtn = `
    <a href="${orderUrl}" style="display:inline-block;background:#15803d;color:#fff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;margin-top:8px">
      Track Your Order
    </a>`;

  const wrap = (title: string, body: string) => `
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="background:#15803d;padding:24px 32px">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800">Halal Meat Co.</h1>
        </div>
        <div style="padding:32px">
          <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">${title}</h2>
          <p style="margin:0 0 16px;color:#64748b;font-size:14px">Hi ${first},</p>
          ${body}
          ${orderBlock}
          ${trackBtn}
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">Halal Meat Co. · Houston, TX · <a href="${APP_URL}" style="color:#94a3b8">halalmeatco.com</a></p>
        </div>
      </div>
    </body></html>`;

  if (event === 'order.confirmed') {
    return {
      subject: `Order Confirmed — ${order.id}`,
      html: wrap('Your order is confirmed!', `<p style="margin:0 0 16px;color:#334155;font-size:14px">Great news — your order has been confirmed and is being prepared. We'll notify you when it's on its way.</p>`),
    };
  }

  if (event === 'order.out_for_delivery') {
    return {
      subject: `Out for Delivery — ${order.id}`,
      html: wrap('Your order is on its way!', `<p style="margin:0 0 16px;color:#334155;font-size:14px">Your order is out for delivery and will arrive during your selected window. Please be available at the address below.</p>`),
    };
  }

  // order.delivered
  return {
    subject: `Delivered — ${order.id}`,
    html: wrap('Your order has been delivered!', `<p style="margin:0 0 16px;color:#334155;font-size:14px">Your order has been delivered. Enjoy your meal! If you have any questions, reply to this email.</p>`),
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  // Verify the caller is an authenticated Supabase user
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  if (!RESEND_API_KEY) {
    // Email not configured — succeed silently so orders still work
    return new Response(JSON.stringify({ ok: true, skipped: 'no RESEND_API_KEY' }), { headers });
  }

  try {
    const body: EmailRequest = await req.json();
    const { event, to, customerName, order } = body;

    if (!event || !to || !order) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
    }

    const { subject, html } = buildEmailContent(event, customerName, order);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[send-order-email] Resend error:', err);
      return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (err) {
    console.error('[send-order-email]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
