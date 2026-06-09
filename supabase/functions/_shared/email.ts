// Shared branded email helpers used by every customer-facing email
// (order status, cancellation, welcome). Keeps one consistent Halaliy look.

const APP_URL        = Deno.env.get('APP_URL') ?? 'https://halaliy.com';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'orders@halaliy.com';
const BUSINESS_NAME  = Deno.env.get('BUSINESS_NAME') ?? 'Halaliy';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

export const EMAIL_BRAND = { APP_URL, FROM_EMAIL, BUSINESS_NAME };

interface BrandedEmailOpts {
  heading: string;            // big title inside the card
  greetingName?: string;      // "Hi {name}," (first name only)
  bodyHtml: string;           // main content (paragraphs / blocks, raw HTML)
  cta?: { label: string; url: string };
}

/** Wrap content in the Halaliy-branded HTML shell (logo header + footer). */
export function brandedEmail({ heading, greetingName, bodyHtml, cta }: BrandedEmailOpts): string {
  const first = greetingName ? greetingName.split(' ')[0] : '';
  const greeting = first
    ? `<p style="margin:0 0 16px;color:#64748b;font-size:14px">Assalamu Alaikum ${first},</p>`
    : '';
  const ctaBtn = cta
    ? `<a href="${cta.url}" style="display:inline-block;background:#15803d;color:#fff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px;margin-top:8px">${cta.label}</a>`
    : '';

  return `<!DOCTYPE html>
  <html><body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,sans-serif">
    <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #e2e8f0">
        <img src="${APP_URL}/logo-full.png" alt="${BUSINESS_NAME}" width="170" height="39" style="display:block;border:0;outline:none;text-decoration:none;height:39px;width:170px" />
      </div>
      <div style="padding:32px">
        <h2 style="margin:0 0 8px;font-size:18px;color:#0f172a">${heading}</h2>
        ${greeting}
        ${bodyHtml}
        ${ctaBtn}
        <p style="margin:24px 0 0;color:#94a3b8;font-size:12px">${BUSINESS_NAME} · Houston, TX · <a href="${APP_URL}" style="color:#94a3b8">halaliy.com</a></p>
      </div>
    </div>
  </body></html>`;
}

/** Send a branded email via Resend. From shows as "Halaliy <orders@halaliy.com>". */
export async function sendBrandedEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!RESEND_API_KEY || !to) return { ok: false, skipped: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `${BUSINESS_NAME} <${FROM_EMAIL}>`, to, subject, html }),
    });
    if (!res.ok) console.error('[email] Resend error:', await res.text());
    return { ok: res.ok };
  } catch (err) {
    console.error('[email] send failed', err);
    return { ok: false };
  }
}
