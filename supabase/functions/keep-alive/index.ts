// Supabase Edge Function — keep-alive (PUBLIC, no JWT)
// Purpose: a public endpoint an external uptime monitor (UptimeRobot / cron-job.org)
// can hit every few minutes to keep the free-tier project from auto-pausing.
// It runs a tiny DB query so the request counts as real database activity.
// Deploy: supabase functions deploy keep-alive --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    // Lightweight DB touch (head + count = no rows transferred) to reset the
    // free-tier inactivity timer.
    const { error } = await supabase.from('orders').select('id', { count: 'exact', head: true });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), { headers });
  } catch (_err) {
    return new Response(JSON.stringify({ ok: false }), { status: 500, headers });
  }
});
