import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, BUSINESS_NAME } from '../constants';

const UPDATED = 'June 9, 2026';

/* ---------------------------------- data ---------------------------------- */

const TRUST_BADGES = [
  { icon: 'fa-certificate', label: '100% Halal' },
  { icon: 'fa-leaf', label: 'Fresh & Local' },
  { icon: 'fa-lock', label: 'Secure Checkout' },
  { icon: 'fa-rotate-left', label: 'Easy Refunds' },
];

const PROMISES = [
  {
    icon: 'fa-seedling',
    title: 'Freshness Guaranteed',
    desc: 'Every order is prepared fresh to order — never frozen stock. If the quality isn’t right, we’ll make it right.',
  },
  {
    icon: 'fa-certificate',
    title: '100% Halal Integrity',
    desc: 'Sourced from trusted local farms and prepared to strict Islamic standards. No shortcuts, ever.',
  },
  {
    icon: 'fa-rotate-left',
    title: 'Honest, Easy Refunds',
    desc: 'Cancel before we schedule your animal and card payments are refunded automatically — no hassle.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Secure Payments',
    desc: 'Cards are processed by Stripe and never stored on our servers. Zelle is supported too.',
  },
];

const SHORT_VERSION = [
  'Cancel anytime before your animal is scheduled — card refunds are automatic.',
  'Not happy with your delivery? Tell us within 24 hours and we’ll fix it.',
  'We deliver fresh across Greater Houston in the time window you pick.',
  'Splitting a whole animal? Everyone pays their share and we confirm once it’s all in.',
  'Your meat is genuinely halal, and your payment details stay private and secure.',
];

interface PolicyItem {
  id: string;
  icon: string;
  title: string;
  summary: string;       // friendly plain-language line
  points: string[];      // key bullet points
  legal?: string;        // firmer protective line
}

const POLICIES: PolicyItem[] = [
  {
    id: 'guarantee',
    icon: 'fa-award',
    title: 'Freshness & Quality Guarantee',
    summary: 'We stand behind every order. If something isn’t right, we’ll make it right.',
    points: [
      'All meat is prepared fresh to order from local farms — never reheated or refrozen stock.',
      'If you’re not satisfied with the quality, quantity, or condition of your delivery, contact us within 24 hours of delivery.',
      'We’ll resolve it quickly with a replacement, store credit, or refund — whichever works best for you.',
    ],
    legal: 'Quality claims must be reported within 24 hours of delivery with photos where applicable so we can verify and resolve them fairly.',
  },
  {
    id: 'refunds',
    icon: 'fa-rotate-left',
    title: 'Cancellations & Refunds',
    summary: 'Plans change — we get it. Here’s exactly how cancellations and refunds work.',
    points: [
      'You can cancel any time before your order moves to “Slaughter Scheduled.” After that the animal is committed to your order and it can’t be cancelled.',
      'Card payments are refunded automatically to your original card (typically 5–10 business days, depending on your bank).',
      'Zelle payments are refunded manually — we’ll reach out to arrange it.',
      'For split orders, every contributor who paid by card is automatically refunded their share.',
    ],
    legal: 'Because our products are fresh, perishable halal meat prepared to order, cancellations are not possible once an order has been scheduled or processed.',
  },
  {
    id: 'delivery',
    icon: 'fa-truck-fast',
    title: 'Delivery',
    summary: 'Fresh to your door across Greater Houston, in a window you choose.',
    points: [
      'We deliver throughout the Greater Houston metropolitan area.',
      'You pick your delivery date and time window at checkout, and we send SMS + email updates along the way.',
      'Since this is fresh meat, someone needs to be available to receive it during your window.',
      'If we can’t deliver because no one is available, we’ll contact you to reschedule.',
    ],
    legal: 'Please ensure your address and phone number are accurate. Repeat delivery attempts due to an incorrect address or no-show may incur an additional delivery fee.',
  },
  {
    id: 'shared',
    icon: 'fa-users',
    title: 'Whole & Shared Animal Orders',
    summary: 'Buying a whole goat, sheep, or cow — solo or split with family and friends — made simple.',
    points: [
      'Order a whole goat, sheep, cow, or chicken on your own, or split the cost as a group.',
      'For split orders, each person receives a secure link to pay their own share.',
      'Your order is confirmed and scheduled once all shares are paid.',
      'If the group doesn’t complete payment, the order stays pending and any paid shares can be refunded.',
    ],
    legal: 'Processing preferences (e.g., cuts and skin options) are selected at checkout and are prepared as specified; please review them carefully before confirming.',
  },
  {
    id: 'halal',
    icon: 'fa-certificate',
    title: 'Halal Sourcing & Preparation',
    summary: 'Halal isn’t a checkbox for us — it’s the whole point.',
    points: [
      `All ${BUSINESS_NAME} meat is sourced from trusted local farms and prepared according to Islamic halal guidelines.`,
      'We’re committed to ethically raised animals and clean, careful handling from farm to your door.',
      'Have a question about sourcing or preparation? Just ask — we’re glad to share the details.',
    ],
  },
  {
    id: 'payments',
    icon: 'fa-lock',
    title: 'Payments & Security',
    summary: 'Pay with confidence. Your details stay protected.',
    points: [
      'Card payments are processed securely by Stripe. We never see or store your full card number.',
      'Zelle is available for those who prefer it — just include your order reference.',
      'You’re charged the total shown at checkout, including any applicable slaughter and delivery fees.',
    ],
    legal: 'Prices and availability may change without notice. Orders are confirmed only once payment (or all shares of a split order) is received.',
  },
  {
    id: 'privacy',
    icon: 'fa-user-shield',
    title: 'Privacy',
    summary: 'We collect only what we need to get your order to you — nothing more.',
    points: [
      'We use your name, email, phone, address, and order details solely to fulfill orders, send updates, and provide support.',
      'We never sell or rent your personal information.',
      'We share data only with the providers needed to run Halaliy (payment, SMS, email) and as required by law.',
      'You can request access to or deletion of your information any time by emailing us.',
    ],
  },
  {
    id: 'terms',
    icon: 'fa-file-contract',
    title: 'Terms of Service',
    summary: 'The straightforward agreement when you order with us.',
    points: [
      'By ordering, you agree to provide accurate information and to pay the total shown at checkout.',
      'Once delivered, you’re responsible for storing and handling the meat safely.',
    ],
    legal: `${BUSINESS_NAME} is not liable for issues arising from improper storage or handling after a successful delivery. These terms are governed by the laws of the State of Texas.`,
  },
];

const FAQS = [
  {
    q: 'Can I cancel my order?',
    a: 'Yes — any time before your order is scheduled for slaughter. Card payments are refunded automatically; Zelle refunds are arranged manually. Once an animal is scheduled, the order can no longer be cancelled.',
  },
  {
    q: 'What if I’m not home for delivery?',
    a: 'Because it’s fresh meat, someone needs to receive it during your chosen window. If no one’s available, we’ll reach out to reschedule — a repeat delivery may incur an extra fee.',
  },
  {
    q: 'How and when do I get my refund?',
    a: 'Approved card refunds go back to your original card automatically, usually within 5–10 business days. Zelle refunds are sent manually after we confirm the details with you.',
  },
  {
    q: 'How does splitting a whole animal work?',
    a: 'Order a whole goat, sheep, or cow and invite others to join. Each person gets a secure link to pay their share, and the order is confirmed once everyone has paid.',
  },
  {
    q: 'Is the meat really halal?',
    a: 'Yes. Every animal is sourced from trusted local farms and prepared to strict Islamic halal standards. We’re happy to answer any sourcing or preparation questions.',
  },
];

/* -------------------------------- component ------------------------------- */

function Accordion({ items, defaultOpen }: { items: { id: string; head: React.ReactNode; body: React.ReactNode }[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const isOpen = open === it.id;
        return (
          <div
            key={it.id}
            id={it.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden scroll-mt-24 transition-colors ${isOpen ? 'border-green-200' : 'border-slate-200'}`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : it.id)}
              className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              {it.head}
              <i className={`fa-solid fa-chevron-down text-slate-400 text-sm ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="px-5 pb-5 pt-1 animate-fadeIn">{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

function CheckList({ points }: { points: string[] }) {
  return (
    <ul className="space-y-2.5">
      {points.map((p, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-slate-600 leading-relaxed">
          <i className="fa-solid fa-circle-check text-green-600 mt-0.5 flex-shrink-0"></i>
          <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PolicyPage() {
  return (
    <div className="animate-fadeIn bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 via-green-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-green-300 text-xs font-bold tracking-widest uppercase mb-4">
            Policies &amp; Promises
          </span>
          <h1 className="font-display font-black text-4xl md:text-5xl mb-4 leading-tight">
            Your trust is our responsibility.
          </h1>
          <p className="text-green-100/90 text-lg max-w-2xl mx-auto">
            Fresh halal meat is a big deal. Here’s exactly how we protect your order, your money,
            and your peace of mind — in plain language.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2 text-sm font-medium">
                <i className={`fa-solid ${b.icon} text-green-300`}></i>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* Promise cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {PROMISES.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 mb-3">
                <i className={`fa-solid ${p.icon} text-lg`}></i>
              </div>
              <h3 className="font-display font-bold text-slate-800 mb-1.5">{p.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Short version */}
        <div className="bg-green-50 border border-green-200 rounded-3xl p-7 md:p-8 mb-14">
          <div className="flex items-center gap-2 mb-4">
            <i className="fa-solid fa-bolt text-green-600"></i>
            <h2 className="font-display font-black text-xl text-green-900">The short version</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {SHORT_VERSION.map((s, i) => (
              <div key={i} className="flex gap-2.5 text-sm text-green-900/90">
                <i className="fa-solid fa-circle-check text-green-600 mt-0.5 flex-shrink-0"></i>
                <span>{s}</span>
              </div>
            ))}
          </div>
          <p className="text-green-700/70 text-xs mt-5">
            The short version is a friendly summary — the full details below are what officially applies.
          </p>
        </div>

        {/* Detailed policies */}
        <div className="mb-14">
          <h2 className="font-display font-black text-2xl text-slate-800 mb-1">The details</h2>
          <p className="text-slate-500 text-sm mb-6">Tap any section to expand it.</p>
          <Accordion
            defaultOpen="refunds"
            items={POLICIES.map((p) => ({
              id: p.id,
              head: (
                <>
                  <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                    <i className={`fa-solid ${p.icon} text-sm`}></i>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{p.title}</div>
                    <div className="text-slate-400 text-xs truncate">{p.summary}</div>
                  </div>
                </>
              ),
              body: (
                <div className="pl-1">
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed">{p.summary}</p>
                  <CheckList points={p.points} />
                  {p.legal && (
                    <p className="text-slate-400 text-xs leading-relaxed mt-4 pt-4 border-t border-slate-100">
                      <i className="fa-solid fa-scale-balanced mr-1.5"></i>
                      {p.legal}
                    </p>
                  )}
                </div>
              ),
            }))}
          />
        </div>

        {/* FAQ */}
        <div className="mb-14">
          <h2 className="font-display font-black text-2xl text-slate-800 mb-1">Frequently asked</h2>
          <p className="text-slate-500 text-sm mb-6">The quick answers customers ask us most.</p>
          <Accordion
            items={FAQS.map((f, i) => ({
              id: `faq-${i}`,
              head: <div className="font-semibold text-slate-800 text-sm">{f.q}</div>,
              body: <p className="text-slate-600 text-sm leading-relaxed pl-1">{f.a}</p>,
            }))}
          />
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-3xl p-8 md:p-10 text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-comments text-2xl text-green-200"></i>
          </div>
          <h3 className="font-display font-black text-2xl mb-2">Still have a question?</h3>
          <p className="text-green-100/90 text-sm mb-6 max-w-md mx-auto">
            Real people, right here in Houston. We’re happy to help before or after you order —
            we usually reply the same day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-block bg-white text-green-800 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors text-sm"
            >
              <i className="fa-solid fa-envelope mr-2"></i>
              Email us
            </a>
            <Link
              to="/contact"
              className="inline-block bg-white/10 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm"
            >
              Contact page
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-10">Last updated {UPDATED}</p>
      </div>
    </div>
  );
}
