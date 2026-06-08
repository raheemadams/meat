// Supabase Edge Function — pay-share (PUBLIC, no JWT)
// Lets an unauthenticated co-buyer pay their share by card. Security: the share
// is identified by the unguessable paymentLinkToken, and the charge amount is
// derived server-side from the stored share (never trusted from the client).
// Marking a share paid only happens after Stripe confirms the PaymentIntent.
// Deploy: supabase functions deploy pay-share --no-verify-jwt
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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

async function findByToken(token: string) {
  const supabase = db();
  const { data: rows } = await supabase
    .from('orders')
    .select('*')
    .contains('portion_owners', JSON.stringify([{ paymentLinkToken: token }]));
  const order = (rows ?? [])[0];
  const owner = order?.portion_owners?.find((o: Record<string, unknown>) => o.paymentLinkToken === token);
  return { supabase, order, owner };
}

// Fire the Make webhook when an order becomes confirmed (server-side, since the
// co-buyer's browser can't run the app's client-side notifier).
async function notifyConfirmed(order: Record<string, unknown>) {
  const url = Deno.env.get('ORDER_WEBHOOK_URL') ?? '';
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'order.confirmed',
        orderId: order.id,
        timestamp: Date.now(),
        order: {
          id: order.id,
          animalType: order.animal_type,
          quantity: order.quantity,
          skinOption: order.skin_option,
          shares: order.shares,
          pricing: order.pricing,
          deliveryAddress: order.delivery_address,
          deliveryDate: order.delivery_date,
          deliveryWindow: order.delivery_window,
          paymentMethod: order.payment_method,
          portionOwners: order.portion_owners,
          status: 'Confirmed',
        },
      }),
    });
  } catch (_) { /* fire-and-forget */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const body = await req.json();
    const token: string = body.token ?? '';
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers });

    // ── Create a PaymentIntent for this share (amount from the DB, not client) ──
    if (body.action === 'create_intent') {
      const { order, owner } = await findByToken(token);
      if (!order || !owner) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
      if (owner.isPaid) return new Response(JSON.stringify({ error: 'already_paid' }), { status: 409, headers });

      const amountCents = Math.round(Number(owner.amount) * 100);
      if (!amountCents || amountCents < 50) {
        return new Response(JSON.stringify({ error: 'Invalid share amount' }), { status: 400, headers });
      }

      const pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        metadata: { orderId: order.id, paymentLinkToken: token, kind: 'share' },
      });
      return new Response(JSON.stringify({ clientSecret: pi.client_secret }), { headers });
    }

    // ── Confirm: verify the PaymentIntent with Stripe, then mark the share paid ──
    if (body.action === 'confirm') {
      const paymentIntentId: string = body.paymentIntentId ?? '';
      if (!paymentIntentId) return new Response(JSON.stringify({ error: 'Missing paymentIntentId' }), { status: 400, headers });

      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== 'succeeded' || pi.metadata?.paymentLinkToken !== token) {
        return new Response(JSON.stringify({ error: 'Payment not verified' }), { status: 402, headers });
      }

      const { supabase, order, owner } = await findByToken(token);
      if (!order || !owner) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });

      const updatedOwners = order.portion_owners.map((o: Record<string, unknown>) =>
        o.paymentLinkToken === token ? { ...o, isPaid: true } : o
      );
      const allPaid = updatedOwners.every((o: Record<string, unknown>) => o.isPaid);
      const newStatus = allPaid ? 'Confirmed' : order.status;

      await supabase.from('orders')
        .update({ portion_owners: updatedOwners, status: newStatus })
        .eq('id', order.id);

      if (allPaid) await notifyConfirmed({ ...order, portion_owners: updatedOwners });

      return new Response(JSON.stringify({ ok: true, allPaid }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers });
  } catch (err) {
    console.error('[pay-share]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
