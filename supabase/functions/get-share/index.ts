// Supabase Edge Function — get-share (PUBLIC, no JWT)
// Looks up a single co-buyer share by its unguessable paymentLinkToken so an
// unauthenticated co-buyer can view & pay it. Returns only that share's data.
// Deploy: supabase functions deploy get-share --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: rows, error } = await supabase
      .from('orders')
      .select('id, animal_type, quantity, skin_option, shares, pricing, portion_owners, delivery_address, delivery_date, delivery_window, status')
      .contains('portion_owners', JSON.stringify([{ paymentLinkToken: token }]));

    if (error) {
      console.error('[get-share]', error);
      return new Response(JSON.stringify({ error: 'Lookup failed' }), { status: 500, headers });
    }

    const row = (rows ?? [])[0];
    const owner = row?.portion_owners?.find((o: Record<string, unknown>) => o.paymentLinkToken === token);
    if (!row || !owner) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers });
    }

    // Return only what the PayMyShare page needs — never the full owner list.
    return new Response(JSON.stringify({
      order: {
        id: row.id,
        animalType: row.animal_type,
        quantity: row.quantity,
        skinOption: row.skin_option,
        shares: row.shares,
        totalPrice: row.pricing?.totalPrice ?? null,
        deliveryAddress: row.delivery_address,
        deliveryDate: row.delivery_date,
        deliveryWindow: row.delivery_window,
        status: row.status,
      },
      owner: {
        name: owner.name,
        amount: owner.amount,
        isPaid: !!owner.isPaid,
      },
    }), { headers });
  } catch (err) {
    console.error('[get-share]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
