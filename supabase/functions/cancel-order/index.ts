// Supabase Edge Function — cancel-order (ADMIN ONLY)
// Cancels an order end-to-end: refunds every succeeded card charge for the order
// (found via the orderId stamped on each Stripe PaymentIntent's metadata), marks
// the order Cancelled, and notifies the customer by email + SMS.
// Deploy: supabase functions deploy cancel-order
// Secrets used (all already set for the other functions):
//   STRIPE_SECRET_KEY, RESEND_API_KEY, FROM_EMAIL, BUSINESS_NAME (optional),
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS (optional override)

import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { brandedEmail, sendBrandedEmail, EMAIL_BRAND } from '../_shared/email.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const BUSINESS_NAME = EMAIL_BRAND.BUSINESS_NAME;

const TWILIO_SID  = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_TOK  = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

// Admins allowed to cancel. Override with the ADMIN_EMAILS secret (comma-separated).
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') ?? 'info@halaliy.com,raheemadams@gmail.com')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function db() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
}

// Twilio needs E.164. Customers type numbers many ways — normalize defensively.
function toE164(raw: string): string | null {
  const trimmed = (raw ?? '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+') && digits.length >= 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

async function sendSms(to: string, body: string) {
  const e164 = toE164(to);
  if (!e164 || !TWILIO_SID || !TWILIO_TOK || !TWILIO_FROM) return;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_SID}:${TWILIO_TOK}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: body }).toString(),
    });
  } catch (_) { /* fire-and-forget */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  // ── Auth: must be a signed-in admin ──────────────────────────────────────
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  const supabase = db();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  const callerEmail = user?.email?.toLowerCase() ?? '';
  if (authError || !user || !ADMIN_EMAILS.includes(callerEmail)) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers });
  }

  try {
    const { orderId, reason } = await req.json();
    if (!orderId) return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers });

    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
    if (order.status === 'Cancelled') {
      return new Response(JSON.stringify({ error: 'already_cancelled' }), { status: 409, headers });
    }

    // ── Refund every succeeded card charge for this order ────────────────────
    let refundedCount = 0;
    let refundedCents = 0;
    try {
      const search = await stripe.paymentIntents.search({
        query: `metadata['orderId']:'${orderId}' AND status:'succeeded'`,
        limit: 100,
      });
      for (const pi of search.data) {
        try {
          const refund = await stripe.refunds.create({ payment_intent: pi.id });
          refundedCount++;
          refundedCents += refund.amount ?? 0;
        } catch (_) { /* already refunded / not refundable — skip */ }
      }
    } catch (e) {
      console.error('[cancel-order] refund search failed', e);
    }
    const refundedDollars = refundedCents / 100;

    // ── Mark the order cancelled (service role bypasses RLS) ─────────────────
    const stamp = `CANCELLED${reason ? `: ${reason}` : ''}` +
      (refundedCount > 0 ? ` — refunded $${refundedDollars.toFixed(2)} to ${refundedCount} payment(s)` : '');
    const newNotes = order.admin_notes ? `${stamp}\n${order.admin_notes}` : stamp;
    await supabase.from('orders').update({ status: 'Cancelled', admin_notes: newNotes }).eq('id', orderId);

    // ── Notify the customer ──────────────────────────────────────────────────
    const { data: customer } = await supabase.auth.admin.getUserById(order.user_id);
    const customerEmail = customer?.user?.email ?? '';
    const customerName = (customer?.user?.user_metadata?.full_name as string)
      ?? customerEmail.split('@')[0] ?? 'there';
    const primaryPhone = (order.portion_owners ?? [])
      .find((o: Record<string, unknown>) => o.isPrimary)?.phone as string ?? '';

    const refundLine = refundedCount > 0
      ? `A refund of $${refundedDollars.toFixed(2)} has been issued to your card and should appear in a few business days.`
      : (order.payment_method === 'ZELLE'
          ? `Since you paid by Zelle, we'll process your refund manually and reach out.`
          : `No card charge was found to refund.`);

    const cancelHtml = brandedEmail({
      heading: 'Your order has been cancelled',
      greetingName: customerName,
      bodyHtml:
        `<p style="margin:0 0 16px;color:#334155;font-size:14px">Your order <strong>${order.id}</strong> (${order.quantity}× ${order.animal_type}) has been cancelled.${reason ? ` Reason: ${reason}.` : ''}</p>` +
        `<p style="margin:0 0 16px;color:#334155;font-size:14px">${refundLine}</p>` +
        `<p style="margin:0 0 16px;color:#334155;font-size:14px">If you have any questions, just reply to this email.</p>`,
    });
    await sendBrandedEmail(customerEmail, `Your ${BUSINESS_NAME} order ${order.id} has been cancelled`, cancelHtml);

    const smsRefund = refundedCount > 0 ? ` A $${refundedDollars.toFixed(2)} refund is on the way.` : '';
    await sendSms(primaryPhone, `Your ${BUSINESS_NAME} order ${order.id} has been cancelled.${smsRefund} Questions? Reply here.`);

    return new Response(
      JSON.stringify({ ok: true, refunded: refundedCount, amount: refundedDollars, emailedTo: customerEmail }),
      { headers },
    );
  } catch (err) {
    console.error('[cancel-order]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
