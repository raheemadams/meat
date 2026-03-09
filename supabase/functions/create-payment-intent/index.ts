// Supabase Edge Function — create-payment-intent
// Runs on Deno. Deploy with: supabase functions deploy create-payment-intent
// Set secret:               supabase secrets set STRIPE_SECRET_KEY=sk_test_...

import Stripe from 'https://esm.sh/stripe@14?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, orderId } = await req.json();

    if (!amount || typeof amount !== 'number' || amount < 50) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,          // already in cents from the client
      currency: 'usd',
      metadata: { orderId: orderId ?? '' },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[create-payment-intent]', err);
    return new Response(JSON.stringify({ error: 'Payment initialization failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
