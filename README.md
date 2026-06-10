# Halaliy — Platform Overview

**Halaliy** (halaliy.com) is a full-stack halal meat ordering & delivery platform built with React, Supabase, and Stripe. Customers browse products, place orders, split costs with others, track deliveries, and set up recurring orders. Tagline: *Fresh. Shared. Delivered.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router (BrowserRouter, clean URLs) |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| Payments | Stripe — **order-first, server-authoritative** card Payment Intents; Zelle (manual verification) |
| Edge Functions | `create-payment-intent` (create_intent + confirm), `pay-share`, `cancel-order`, `send-order-email`, `send-welcome-email`, `send-sms`, `get-share` — shared branded email in `_shared/email.ts` |
| Transactional email | Resend (branded template shared across all customer emails) |
| Transactional SMS | Twilio (via `send-sms` Edge Function; E.164-normalized server-side) |
| Order automation | Make.com webhook on order-confirmed (`VITE_ORDER_WEBHOOK_URL`) |
| Deployment | GitHub (`raheemadams/meat`) → Vercel, auto-deploy on push to `main` |
| Uptime | GitHub Actions cron pings Supabase REST every 2 days to prevent free-tier pausing |

---

## Products

| Product | Type | Pricing | Notes |
|---|---|---|---|
| Whole Goat | Live animal | per whole | Shareable, skin-burnt option |
| Whole Cow | Live animal | per whole | Shareable up to 7 ways |
| Chicken | Bulk birds | per bird | Minimum quantity enforced |
| Goat Meat | Bagged, ready-to-cook | per weight (2/5/10 lb) | No sharing, no skin option |
| Cow Skin | Bagged, ready-to-cook | per weight (2/5 lb) | No sharing, no skin option |

Bagged products use a **size/variant selector** in the booking form and persist the chosen weight as `bag_size`.

---

## Features Built

### Ordering
- **Product selector** — live animals and bagged products, each with its own rules
- **Size/variant picker** — for bagged products (Goat Meat, Cow Skin)
- **Skin-burnt option** — goat only; toggle for traditional flame-based skin removal (adds fee)
- **Quantity picker** — minimum quantity enforced per product type
- **Multi-step booking form** — Configure → Split (optional) → Delivery → Payment
- **Delivery address** — captured at signup, pre-fills the order; option to use a different address
- **Delivery date & window selection** — choose from upcoming dates and time windows
- **Recurring orders** — set an order as monthly, every 2 months, or every 3 months

### Split Payments
- **Share splitting** — split a single animal order among up to 7 people
- **Co-purchaser entry** — collect name and phone for each person
- **Payment links** — unique per-person payment link, copyable and SMS-able
- **PayMyShare page** — unauthenticated landing page for secondary payers
- **Auto-confirm** — order confirms automatically once all shares are paid

### Payments
- **Order-first card checkout** — the order is created first (status *Pending Payment*); the charge is derived **server-side from the stored order**, and the order is confirmed only after the PaymentIntent is verified to have `succeeded`. The client cannot set its own price or mark an order paid without paying.
- **Server-authoritative pricing** — a Postgres function (`compute_order_pricing`) + BEFORE INSERT trigger recompute every order's price and each share from a trusted catalog, overriding any client-supplied values.
- **Zelle payments** — reference code generated; admin manually verifies
- **Per-share pricing** — each participant sees and pays only their share

### Order Tracking
- **My Orders page** — all user orders with live status
- **Status timeline** — visual step-by-step progress tracker per order
- **Subscription badge** — shows recurring interval on the order card
- **Split payment status** — per-member paid/pending indicator

### Admin Dashboard
- **Order log** — all orders across users, filterable by status (incl. Cancelled)
- **One-click + batch advancement** — advance a single order from its row, or move every order in a stage forward at once
- **Zelle verification** — mark Zelle payments as verified
- **Cancel & refund** — cancel an order, auto-refund all card charges via Stripe (found by `orderId` metadata), and notify the customer; Zelle refunds flagged as manual
- **Admin notes** — internal notes per order
- **Stats overview** — revenue, active orders, products ordered (excludes cancelled / unpaid)
- **CSV export** — download order data for accounting/reporting

### Content Pages
- **Policies & FAQs** (`/policies`) — trust-focused, accordion-based refund/cancellation, delivery, halal, privacy, and terms, with chargeback / liability / force-majeure protections
- **Contact** (`/contact`) — service-area map, hours, Zelle details, and a contact form

### Notifications
- **Branded emails** — one shared Halaliy template (`_shared/email.ts`) powers welcome, order confirmed / out-for-delivery / delivered, and cancellation emails via Resend. The recipient is resolved **server-side from the order owner**, so status emails reach the customer (not whoever triggered the change). Assets/links use the canonical `www.halaliy.com` host.
- **Welcome email** — sent automatically on signup (`send-welcome-email`), plus an in-app welcome toast
- **Order SMS** — Twilio (`send-sms`): the customer is texted on **Confirmed** and **Delivered** only; co-buyers receive their PayMyShare links. Numbers are normalized to E.164 server-side.
- **Make.com webhook** — fires on order-confirmed for downstream automations (Telegram + Data Store)

### Auth & Profiles
- **Supabase Auth** — email/password sign up and sign in
- **Signup captures** full name, phone, and default delivery address
- **Edit profile** — update name, phone, and delivery address (applied immediately via `USER_UPDATED`)
- **Persistent session** + rate-limit-storm detection

### Infrastructure
- **Row Level Security** — users see only their own orders; admins (email allow-list) see all
- **Realtime** — Supabase Realtime keeps the order list live
- **Keep-alive** — GitHub Actions cron keeps the free-tier Supabase project awake

---

## Marketing & Growth Tools

The repo ships with a self-contained marketing toolkit alongside the app.

### Brand kit
- **[BRAND_KIT.md](BRAND_KIT.md)** — full guidelines: logo usage, color palette, typography (Outfit + Inter), voice & tone, imagery, hashtags.
- **Logo & assets** in [`public/`](public/), all derived from the master `halaliy-logo.png`:
  `logo-full.png`, `logo-mark.png`, app icons (`icon-512/192`, `favicon-64`), `og-image.png`, and a visual one-pager `brand-sheet.png`.
- **Regenerate every asset** from the master logo: `npm i sharp --no-save && node scripts/render-logos.mjs`

### 52-week social media content system
- **[Halaliy_52Week_SocialMedia_Prompt.md](Halaliy_52Week_SocialMedia_Prompt.md)** — a complete content system prompt: brand identity, products, mascot, a 52-week content arc (awareness → growth → community → conversion), per-platform layout specs for **LinkedIn (1200×627), Facebook (1200×630), TikTok (1080×1920)**, copy rules, and a hashtag pool. Designed to generate 156 static posts (52 weeks × 3 platforms).
- **[`social-media/`](social-media/)** — rendered assets (e.g. `week-01/` for LinkedIn, Facebook, TikTok).

### SEO / social sharing
- **Open Graph + Twitter cards** in `index.html` point to `og-image.png`, so links to halaliy.com unfurl with a branded preview card.
- Page `<title>` and meta description set for the brand.

### Order automation (Make.com)
- On every order confirmation, the app POSTs the order as `application/json` to `VITE_ORDER_WEBHOOK_URL` (a Make.com hook), which fans out via a Router to a **Telegram** alert and a **Data Store** record. Easily routed to email lists, CRMs, Google Sheets, Slack, etc.
- **Full runbook:** [docs/ORDER_WEBHOOK.md](docs/ORDER_WEBHOOK.md) — when it fires, payload schema, Make scenario layout, field mapping (`{{1.…}}`), config, and how to test.

### Lifecycle messaging
- **Resend** branded emails and **Twilio** SMS cover the order lifecycle (confirmed → out for delivery → delivered), useful for retention and re-engagement.

### Retention features
- **Recurring orders** (1/2/3-month intervals) and **CSV export** for cohort/repeat-purchase analysis.

---

## Security Posture

| Area | Status |
|---|---|
| RLS — own-order isolation | ✅ Users read/insert their own orders; **direct customer UPDATE removed** (`011`) — all mutations go via admin RLS or service-role functions |
| RLS — admin access | ✅ Email allow-list (`info@halaliy.com`, `raheemadams@gmail.com`); see `007_add_personal_admin.sql` |
| Pricing integrity | ✅ Order price + every share recomputed server-side by a trigger; can't be tampered (`012`) |
| Payment verification | ✅ Order-first checkout confirms an order only after its PaymentIntent is verified `succeeded` (amount + orderId match) |
| Co-buyer payments | ✅ Routed through the service-role `pay-share` Edge Function (bypasses RLS safely) |
| Edge Function auth | ✅ Verifies the caller's JWT; `cancel-order` additionally enforces an admin allow-list |
| Refunds | ✅ Cancellation refunds card charges via Stripe (found by `orderId` metadata) |
| `.env` exposure | ✅ Not tracked in git; secrets set in Vercel + Supabase |

### Outstanding security items
- **Pricing catalog is duplicated** — `constants.ts` (UI display) and `compute_order_pricing()` (authoritative charge) must be kept in sync when prices change; ideally serve prices from one source.
- **Residual on the primary card charge** — the `confirm` step verifies amount + orderId, so this is effectively closed; the fully belt-and-suspenders version would also reject mismatched product params.
- **No rate limiting on order creation** — authenticated users could create many (unpaid) *Pending Payment* orders.
- **Abandoned *Pending Payment* orders linger** until an admin cancels them (no auto-expiry yet).
- **No React error boundary** — unhandled component errors cause a white screen.

---

## Database Schema (`orders`)

```
id                     TEXT PRIMARY KEY
user_id                UUID → auth.users
animal_type            TEXT   (Goat | Cow | Chicken | Goat Meat | Cow Skin)
quantity               INTEGER
skin_option            TEXT   (BURNT | NOT_BURNT)
shares                 INTEGER
portion_owners         JSONB  [{ id, name, phone, isPaid, amount, ... }]
pricing                JSONB  { animalSubtotal, slaughterFee, deliveryCharge, totalPrice, perShareAmount }
bag_size               TEXT?  (selected weight for bagged products, e.g. '2 lb')
delivery_address       TEXT
delivery_date          DATE
delivery_window        TEXT
status                 TEXT   (Pending Payment | Pending Verification | Awaiting Split Payments | Confirmed → Slaughter Scheduled → … → Delivered | Cancelled)
payment_method         TEXT   (CARD | ZELLE)
zelle_ref_code         TEXT?
admin_notes            TEXT?
subscription_interval  INTEGER?  (1 | 2 | 3 months, NULL = one-time)
timestamp              BIGINT
created_at             TIMESTAMPTZ
```

Migrations live in [`supabase/migrations/`](supabase/migrations/) (001–015). Order pricing is enforced server-side by the `compute_order_pricing()` function + a BEFORE INSERT trigger (`012`); customer UPDATE was removed in `011`.

> ⚠️ The price list in `compute_order_pricing()` must be kept in sync with `constants.ts` (`ANIMAL_CONFIGS`, `DELIVERY_CHARGE`, `SLAUGHTER_FEE`) when prices change.

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production build → dist/
```

Required env vars (`.env`, not committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAIL`, `VITE_ORDER_WEBHOOK_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`. The same vars are set in the Vercel project for production.

Edge Function secrets (set via `supabase secrets set`): `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `APP_URL` (= `https://www.halaliy.com`), `BUSINESS_NAME`, `CONTACT_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `ADMIN_EMAILS` (for `cancel-order`), `ORDER_WEBHOOK_URL`, `ALLOWED_ORIGINS` (plus the auto-provided `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`).

> Note: `APP_URL` uses the **www** host on purpose — the apex `halaliy.com` 308-redirects, which email clients won't follow for images.

---

## Suggested Enhancements

### High value (revenue / retention)
1. **Real Stripe subscription billing** — wire the recurring-order toggle to Stripe Subscriptions so payments auto-charge on schedule.
2. **Referral system** — referral codes with a discount when a new customer uses one.
3. **Loyalty points** — earn per dollar, redeem on future orders.
4. **Promo codes / discounts** — admin-created % or flat discounts at checkout.

### Operational
5. **Admin: subscription management** — view/cancel active subscriptions, see next charge dates.
6. **Admin: inventory/capacity limits** — cap orders per delivery date.
7. **Delivery driver view** — stripped-down list of today's deliveries.
8. **Auto-expire abandoned orders** — a scheduled job that cancels stale *Pending Payment* orders (card checkout abandoned before payment).

### Customer experience
9. **Re-order button** — one-tap reorder of a previous order.
10. **Order history search** — by date, product, amount.
11. **Customer reviews** — rate/review after delivery.
12. **Dark mode**.

### Technical
13. **Pagination in admin dashboard** — currently loads all orders at once.
14. **React error boundary** — graceful failure instead of white screen.
15. **PWA / offline support**.
16. **Supabase Storage** for product images instead of external URLs.
17. **End-to-end tests** (Playwright) for order, payment, and admin flows.
18. **Staging environment** — separate Supabase project + Vercel preview.
