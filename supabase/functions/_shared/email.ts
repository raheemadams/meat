// Shared branded email helpers used by every customer-facing email
// (order status, cancellation, welcome). Keeps one consistent Halaliy look.

// Use the canonical www host — the apex halaliy.com issues a 308 redirect that
// email clients won't follow for images, which breaks the logo and links.
// Use the canonical www host — the apex halaliy.com issues a 308 redirect that
// email clients won't follow for images, which breaks the logo and links.
const APP_URL        = Deno.env.get('APP_URL') ?? 'https://www.halaliy.com';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'orders@halaliy.com';
const BUSINESS_NAME  = Deno.env.get('BUSINESS_NAME') ?? 'Halaliy';
const SUPPORT_EMAIL  = Deno.env.get('CONTACT_EMAIL') ?? 'info@halaliy.com';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

export const EMAIL_BRAND = { APP_URL, FROM_EMAIL, BUSINESS_NAME, SUPPORT_EMAIL };

interface BrandedEmailOpts {
  headerTitle: string;        // big white title in the green header band
  subtitle?: string;          // small tagline under the header title
  heading?: string;           // optional bold headline sentence in the body
  greetingName?: string;      // "Assalamu Alaikum {name}," (first name only)
  bodyHtml: string;           // main content (paragraphs / blocks, raw HTML)
  cta?: { label: string; url: string };
  footerNote?: string;        // e.g. "JazakAllahu khairan for trusting Halaliy."
  footerCta?: { label: string; url: string }; // e.g. "Order Again"
}

/** Wrap content in the Halaliy-branded HTML shell: green header with a centered
 *  logo icon + title, left-aligned body, and a footer with support + year.
 *  Built with email-safe inline styles. */
export function brandedEmail(opts: BrandedEmailOpts): string {
  const { headerTitle, subtitle, heading, greetingName, bodyHtml, cta, footerNote, footerCta } = opts;
  const year = new Date().getFullYear();
  const first = greetingName ? greetingName.split(' ')[0] : '';

  const headingHtml = heading
    ? `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:800">${heading}</h1>`
    : '';
  const greeting = first
    ? `<p style="margin:0 0 16px;color:#334155;font-size:15px">Assalamu Alaikum ${first},</p>`
    : '';
  const ctaBtn = cta
    ? `<div style="margin:28px 0 4px">
         <a href="${cta.url}" style="display:inline-block;background:#15803d;color:#ffffff;font-weight:700;padding:14px 30px;border-radius:12px;text-decoration:none;font-size:15px;box-shadow:0 2px 6px rgba(21,128,61,.3)">${cta.label}</a>
       </div>`
    : '';
  const footerNoteHtml = footerNote
    ? `<div style="color:#475569;font-size:13px;margin:0 0 10px">${footerNote}</div>`
    : '';
  const footerCtaHtml = footerCta
    ? `<div style="margin:0 0 12px"><a href="${footerCta.url}" style="color:#15803d;font-size:13px;font-weight:700;text-decoration:none">${footerCta.label} →</a></div>`
    : '';

  return `<!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#eef2f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:28px 14px">
      <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 20px rgba(15,23,42,.10)">

        <!-- Header: centered logo icon + title -->
        <div style="background:#14532d;background:linear-gradient(135deg,#15803d 0%,#14532d 100%);padding:34px 24px 30px;text-align:center">
          <img src="${APP_URL}/icon-192.png" alt="${BUSINESS_NAME}" width="64" height="64" style="width:64px;height:64px;border-radius:16px;display:inline-block;border:0;background:#ffffff" />
          <div style="margin-top:14px;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:.3px">${headerTitle}</div>
          <div style="margin-top:4px;color:#bbf7d0;font-size:13px">${subtitle ?? 'Fresh halal meat · Houston, TX'}</div>
        </div>

        <!-- Body (left-aligned) -->
        <div style="padding:34px 34px 8px">
          ${headingHtml}
          ${greeting}
          <div style="color:#334155;font-size:15px;line-height:1.6">${bodyHtml}</div>
          ${ctaBtn}
        </div>

        <!-- Footer -->
        <div style="padding:26px 34px 30px;text-align:center">
          <div style="border-top:1px solid #eef2f7;padding-top:20px">
            ${footerNoteHtml}
            ${footerCtaHtml}
            <div style="color:#94a3b8;font-size:12px">Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color:#15803d;text-decoration:none">${SUPPORT_EMAIL}</a></div>
            <div style="color:#94a3b8;font-size:12px;margin-top:4px">© ${year} ${BUSINESS_NAME} · Houston, TX · <a href="${APP_URL}" style="color:#15803d;text-decoration:none">www.halaliy.com</a></div>
          </div>
        </div>

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
