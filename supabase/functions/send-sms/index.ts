// Supabase Edge Function — send-sms
// Deploy: supabase functions deploy send-sms --no-verify-jwt
// Secrets: supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+1...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
const TWILIO_FROM        = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function sendTwilioSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    return { ok: false, error: 'Twilio not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body }).toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err.message ?? `Twilio error ${res.status}` };
  }
  return { ok: true };
}

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
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  try {
    const body = await req.json();

    // ── Bulk split-payment links ──────────────────────────────────────────────
    // Payload: { type: 'split_links', messages: [{ to, body }] }
    if (body.type === 'split_links') {
      const messages: { to: string; body: string }[] = body.messages ?? [];
      const results = await Promise.all(messages.map((m) => sendTwilioSms(m.to, m.body)));
      const failed = results.filter((r) => !r.ok);
      return new Response(
        JSON.stringify({ ok: true, sent: results.length - failed.length, failed: failed.length }),
        { headers },
      );
    }

    // ── Single order status notification ─────────────────────────────────────
    // Payload: { type: 'status_update', to, message }
    if (body.type === 'status_update') {
      const { to, message } = body;
      if (!to || !message) {
        return new Response(JSON.stringify({ error: 'Missing to or message' }), { status: 400, headers });
      }
      const result = await sendTwilioSms(to, message);
      return new Response(JSON.stringify(result), { headers });
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400, headers });
  } catch (err) {
    console.error('[send-sms]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
  }
});
