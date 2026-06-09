// Supabase Edge Function — send-welcome-email
// Sends a branded welcome email to a newly signed-up user. Called by the client
// right after signup (the user's own JWT identifies the recipient).
// Deploy: supabase functions deploy send-welcome-email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';
import { brandedEmail, sendBrandedEmail, EMAIL_BRAND } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const name = (user.user_metadata?.full_name as string) ?? user.email.split('@')[0];

  const html = brandedEmail({
    heading: `Welcome to ${EMAIL_BRAND.BUSINESS_NAME}! 🐐`,
    greetingName: name,
    bodyHtml:
      `<p style="margin:0 0 16px;color:#334155;font-size:14px">Thank you for joining ${EMAIL_BRAND.BUSINESS_NAME} — fresh halal meat from local Houston farms, delivered to your door.</p>` +
      `<div style="background:#f8fafc;border-radius:12px;padding:20px;margin:0 0 20px;font-size:14px;color:#334155">
         <p style="margin:0 0 10px"><strong>Here's what you can do:</strong></p>
         <p style="margin:0 0 8px">🐄 Order a whole goat, cow, or bulk chicken — fresh and halal.</p>
         <p style="margin:0 0 8px">👨‍👩‍👧‍👦 Split the cost with family &amp; friends — everyone pays their share.</p>
         <p style="margin:0 0 8px">🚚 Pick your delivery date &amp; window at checkout.</p>
         <p style="margin:0">📦 Track every order from confirmation to your doorstep.</p>
       </div>` +
      `<p style="margin:0 0 16px;color:#334155;font-size:14px">Ready when you are — pick your animal and place your first order.</p>`,
    cta: { label: 'Browse Animals', url: EMAIL_BRAND.APP_URL },
  });

  const result = await sendBrandedEmail(user.email, `Welcome to ${EMAIL_BRAND.BUSINESS_NAME}!`, html);
  if (!result.ok && !result.skipped) {
    return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 502, headers });
  }
  return new Response(JSON.stringify({ ok: true, skipped: result.skipped ?? false }), { headers });
});
