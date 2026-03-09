// Supabase Edge Function — create-payment-intent
// Runs on Deno. Deploy with: supabase functions deploy create-payment-intent
// Set secret:               supabase secrets set STRIPE_SECRET_KEY=sk_test_...

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

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  // Verify the caller is an authenticated Supabase user
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  // Use the service role key to verify the user's JWT — the recommended
  // pattern for Supabase Edge Functions. getUser(token) validates the JWT
  // without requiring the anon key's RLS context.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    const { amount, orderId } = await req.json();

    if (!amount || typeof amount !== 'number' || amount < 50) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers });
    }

    if (!orderId || typeof orderId !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid orderId' }), { status: 400, headers });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { orderId, userId: user.id },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers },
    );
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return new Response(JSON.stringify({ error: 'Payment initialization failed' }), {
      status: 500,
      headers,
    });
  }
});
