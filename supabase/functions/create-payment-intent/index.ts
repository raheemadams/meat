// Supabase Edge Function — create-payment-intent (order-first, server-authoritative)
// Two actions, both keyed off an order that already exists in the DB (so the
// charge is derived from the stored, trigger-priced order — the client can never
// dictate the amount, and payment is verified server-side before marking paid):
//   • create_intent: { action:'create_intent', orderId } → PI for the order's per-share amount
//   • confirm:       { action:'confirm', orderId, paymentIntentId } → verify PI succeeded, mark paid
// Deploy: supabase functions deploy create-payment-intent
// Secret: STRIPE_SECRET_KEY

import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowed = origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
    ? origin
    : ALLOWED_ORIGINS[0] ?? '*';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  try {
    const body = await req.json();
    const action: string = body.action ?? 'create_intent';
    const orderId: string = body.orderId ?? '';
    if (!orderId) return new Response(JSON.stringify({ error: 'Missing orderId' }), { status: 400, headers });

    // Load the order and confirm it belongs to the caller.
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order || order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
    }

    const perShare = Number((order.pricing ?? {}).perShareAmount);
    const amount = Math.round(perShare * 100);
    if (!amount || amount < 50) {
      return new Response(JSON.stringify({ error: 'Invalid order amount' }), { status: 400, headers });
    }

    // ── Create a PaymentIntent for the order's per-share amount ───────────────
    if (action === 'create_intent') {
      if (order.payment_method !== 'CARD' || order.status !== 'Pending Payment') {
        return new Response(JSON.stringify({ error: 'Order is not awaiting card payment' }), { status: 409, headers });
      }
      const pi = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: { orderId, userId: user.id },
      });
      return new Response(JSON.stringify({ clientSecret: pi.client_secret }), { headers });
    }

    // ── Verify the PaymentIntent succeeded, then mark the order paid ──────────
    if (action === 'confirm') {
      const paymentIntentId: string = body.paymentIntentId ?? '';
      if (!paymentIntentId) return new Response(JSON.stringify({ error: 'Missing paymentIntentId' }), { status: 400, headers });

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== 'succeeded' || pi.metadata?.orderId !== orderId || pi.amount !== amount) {
        return new Response(JSON.stringify({ error: 'Payment not verified' }), { status: 402, headers });
      }

      // Idempotent: if already confirmed, just return it.
      if (order.status !== 'Pending Payment') {
        return new Response(JSON.stringify({ ok: true, order }), { headers });
      }

      const updatedOwners = (order.portion_owners ?? []).map((o: Record<string, unknown>) =>
        o.isPrimary ? { ...o, isPaid: true, paymentMethod: 'CARD', paymentRef: paymentIntentId } : o
      );
      const newStatus = order.shares > 1 ? 'Awaiting Split Payments' : 'Confirmed';

      const { data: updated } = await supabase
        .from('orders')
        .update({ portion_owners: updatedOwners, status: newStatus })
        .eq('id', orderId)
        .select('*')
        .single();

      return new Response(JSON.stringify({ ok: true, order: updated }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers });
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return new Response(JSON.stringify({ error: 'Payment processing failed' }), { status: 500, headers });
  }
});
