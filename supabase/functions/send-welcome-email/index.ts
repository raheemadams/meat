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
  const first = name.split(' ')[0];

  const html = brandedEmail({
    headerTitle: `Welcome to ${EMAIL_BRAND.BUSINESS_NAME}`,
    subtitle: 'Fresh. Shared. Delivered.',
    heading: `Assalamu Alaikum, ${first}`,
    bodyHtml:
      `<p style="margin:0 0 18px;color:#334155;font-size:15px">Welcome to ${EMAIL_BRAND.BUSINESS_NAME}. We're excited to make fresh halal meat ordering easier, cleaner, and more reliable for families in Houston.</p>` +
      `<div style="background:#f8fafc;border:1px solid #eef2f7;border-radius:14px;padding:20px;margin:0 0 4px;font-size:14px;color:#334155;line-height:1.6">
         <p style="margin:0 0 12px"><strong style="color:#0f172a">What you can order:</strong> whole goat, cow shares, fresh chicken, and specialty cuts.</p>
         <p style="margin:0 0 12px"><strong style="color:#0f172a">How it works:</strong> choose your meat, select your processing preference, and schedule delivery.</p>
         <p style="margin:0"><strong style="color:#0f172a">Our promise:</strong> fresh halal meat, clear updates, and dependable delivery.</p>
       </div>`,
    cta: { label: 'Start Your First Order', url: EMAIL_BRAND.APP_URL },
    footerNote: 'JazakAllahu khairan for choosing Halaliy.',
  });

  const result = await sendBrandedEmail(user.email, `Welcome to ${EMAIL_BRAND.BUSINESS_NAME}!`, html);
  if (!result.ok && !result.skipped) {
    return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 502, headers });
  }
  return new Response(JSON.stringify({ ok: true, skipped: result.skipped ?? false }), { headers });
});
