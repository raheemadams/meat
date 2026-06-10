import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '../constants';

const UPDATED = 'June 9, 2026';

/* ---------------------------------- data ---------------------------------- */

const TRUST_BADGES = [
  { icon: 'fa-certificate', label: '100% Halal' },
  { icon: 'fa-leaf', label: 'Fresh & Local' },
  { icon: 'fa-lock', label: 'Secure Checkout' },
  { icon: 'fa-rotate-left', label: 'Easy Refunds' },
];

const QUICK_FAQS = [
  {
    q: 'Can I cancel my order?',
    a: `Yes. Orders may be cancelled at any time before they reach "Slaughter Scheduled." Once an animal has been scheduled for processing, the order can no longer be cancelled because the animal has been committed to your order.`,
  },
  {
    q: 'How long do refunds take?',
    a: `Card refunds are automatically returned to the original payment method and typically appear within 5–10 business days. Zelle refunds are processed manually and our team will contact you to arrange the return of funds.`,
  },
  {
    q: 'Is your meat halal?',
    a: `Yes. All animals are processed according to Islamic halal requirements and sourced from trusted local farms. We are committed to ethical handling, cleanliness, and quality from farm to delivery.`,
  },
  {
    q: 'Do you guarantee a specific meat weight?',
    a: `No. Livestock are natural agricultural products and meat yield varies based on animal size, breed, age, fat content, and processing preferences. Unless explicitly stated, Halaliy does not guarantee a specific final packaged meat weight.`,
  },
  {
    q: 'What happens if I am not home during delivery?',
    a: `Because our products are fresh and perishable, someone should be available to receive the order. If no one is available, we will attempt to contact you and arrange a redelivery. Additional delivery charges may apply.`,
  },
  {
    q: 'What if there is a problem with my order?',
    a: `If there is a quality issue, missing item, incorrect item, or another problem caused by us, please contact us within 24 hours of delivery. Our team will review the issue and work with you to provide a replacement, store credit, partial refund, or full refund when appropriate.`,
  },
  {
    q: 'What areas do you deliver to?',
    a: `We currently deliver throughout the Greater Houston metropolitan area.`,
  },
];

type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'ul'; items: string[] };

interface DetailedPolicy {
  id: string;
  icon: string;
  title: string;
  summary: string;
  blocks: Block[];
}

const DETAILED: DetailedPolicy[] = [
  {
    id: 'refunds',
    icon: 'fa-rotate-left',
    title: 'Refund & Cancellation Policy',
    summary: 'Cancellations, refunds, shared orders, and product variability.',
    blocks: [
      { type: 'p', text: `At Halaliy, we prepare fresh halal meat specifically for each order. Because livestock and processing are scheduled in advance, cancellations are time-sensitive.` },
      { type: 'h3', text: 'Order Cancellations' },
      { type: 'p', text: `You may request a cancellation at any time before your order status changes to "Slaughter Scheduled."` },
      { type: 'p', text: `Once an order has been scheduled for processing or slaughter, it can no longer be cancelled because the animal has been committed to your order.` },
      { type: 'h3', text: 'Refund Processing' },
      { type: 'h4', text: 'Card Payments' },
      { type: 'p', text: `Approved refunds will be returned to the original payment method.` },
      { type: 'p', text: `Depending on your bank, refunds typically appear within 5–10 business days.` },
      { type: 'h4', text: 'Zelle Payments' },
      { type: 'p', text: `Approved refunds for Zelle transactions are processed manually.` },
      { type: 'p', text: `Our team will contact you to arrange the return of funds.` },
      { type: 'h3', text: 'Shared Animal Orders' },
      { type: 'p', text: `For split or shared-animal purchases, all participants must complete payment before processing begins.` },
      { type: 'p', text: `If a participant fails to pay, Halaliy reserves the right to cancel the order, substitute participants, or adjust processing and delivery timelines.` },
      { type: 'h3', text: 'Product Issues' },
      { type: 'p', text: `If there is a problem with your order due to quality concerns, incorrect items, missing items, or an error on our part, please contact us within 24 hours of delivery.` },
      { type: 'p', text: `We may request photos or additional information to help investigate the issue.` },
      { type: 'p', text: `At our discretion, we may provide a replacement, partial refund, store credit, or full refund depending on the circumstances.` },
      { type: 'h3', text: 'Product Variability' },
      { type: 'p', text: `Livestock products are natural agricultural products.` },
      { type: 'p', text: `Animal size, meat yield, fat content, bone content, and final packaged weight may vary.` },
      { type: 'p', text: `Unless explicitly stated at the time of purchase, Halaliy does not guarantee a specific final packaged meat weight.` },
      { type: 'p', text: `Product photos shown on our website are for illustration purposes only and may not exactly represent the delivered product.` },
    ],
  },
  {
    id: 'delivery',
    icon: 'fa-truck-fast',
    title: 'Delivery Policy',
    summary: 'Service area, receiving your order, and proof of delivery.',
    blocks: [
      { type: 'p', text: `Halaliy currently delivers throughout the Greater Houston metropolitan area.` },
      { type: 'p', text: `At checkout, customers select a preferred delivery date and delivery window.` },
      { type: 'p', text: `While we make every effort to deliver within the selected timeframe, delivery times may occasionally vary due to weather, traffic, livestock processing schedules, or other circumstances beyond our control.` },
      { type: 'h3', text: 'Receiving Your Order' },
      { type: 'p', text: `Because our products are fresh and perishable, someone must be available to receive the order during the selected delivery window.` },
      { type: 'p', text: `You will receive SMS and email updates as your order progresses through preparation and delivery.` },
      { type: 'h3', text: 'Failed Deliveries' },
      { type: 'p', text: `If no one is available to receive the order, Halaliy will attempt to contact you using the phone number provided at checkout.` },
      { type: 'p', text: `Additional delivery fees may apply for rescheduled deliveries or repeated delivery attempts.` },
      { type: 'h3', text: 'Delivery Information' },
      { type: 'p', text: `Customers are responsible for providing an accurate delivery address, phone number, gate codes, apartment numbers, and any other information necessary for successful delivery.` },
      { type: 'h3', text: 'Transfer of Responsibility' },
      { type: 'p', text: `Responsibility for the order transfers to the customer upon successful delivery.` },
      { type: 'p', text: `Delivery may be confirmed through:` },
      { type: 'ul', items: ['Customer signature', 'Delivery photographs', 'GPS records', 'Text confirmation', 'Delivery instructions', 'Other reasonable proof of delivery'] },
      { type: 'p', text: `After delivery, customers are responsible for properly refrigerating, freezing, storing, and handling all meat products.` },
      { type: 'p', text: `Halaliy is not responsible for spoilage resulting from delayed refrigeration, improper storage, or customer handling after delivery.` },
      { type: 'h3', text: 'Force Majeure' },
      { type: 'p', text: `Halaliy shall not be liable for delays or inability to perform due to severe weather, natural disasters, transportation disruptions, government actions, livestock availability issues, power outages, or other circumstances beyond our reasonable control.` },
    ],
  },
  {
    id: 'halal',
    icon: 'fa-certificate',
    title: 'Halal & Quality Assurance',
    summary: 'Sourcing, freshness, food safety, and transparency.',
    blocks: [
      { type: 'p', text: `At Halaliy, we are committed to providing fresh, high-quality halal meat sourced from trusted local farms.` },
      { type: 'p', text: `All animals are handled with care and processed in accordance with Islamic halal requirements.` },
      { type: 'p', text: `We work closely with our suppliers and processing partners to maintain high standards for animal welfare, cleanliness, food safety, and quality throughout the entire process — from farm to delivery.` },
      { type: 'h3', text: 'Freshness Commitment' },
      { type: 'p', text: `Our meat is prepared specifically for customer orders and delivered as fresh as possible.` },
      { type: 'p', text: `We carefully inspect products before delivery to help ensure quality and customer satisfaction.` },
      { type: 'h3', text: 'Food Safety' },
      { type: 'p', text: `Customers are responsible for properly storing meat products immediately upon delivery.` },
      { type: 'p', text: `Fresh meat should be refrigerated or frozen promptly according to food safety guidelines.` },
      { type: 'h3', text: 'Questions About Sourcing' },
      { type: 'p', text: `We believe transparency builds trust.` },
      { type: 'p', text: `If you have questions about sourcing, processing, halal practices, or animal welfare standards, please contact our team and we will be happy to provide additional information.` },
    ],
  },
  {
    id: 'privacy',
    icon: 'fa-user-shield',
    title: 'Privacy Policy',
    summary: 'What we collect, how payments are handled, and your rights.',
    blocks: [
      { type: 'p', text: `We collect only the information necessary to process orders, deliver products, communicate with customers, and provide support.` },
      { type: 'p', text: `This information may include:` },
      { type: 'ul', items: ['Name', 'Email Address', 'Phone Number', 'Delivery Address', 'Order Information', 'Payment Information'] },
      { type: 'h3', text: 'Payments' },
      { type: 'p', text: `Card payments are securely processed through Stripe.` },
      { type: 'p', text: `Halaliy does not store complete credit card information on its servers.` },
      { type: 'h3', text: 'Communications' },
      { type: 'p', text: `By providing your phone number and email address, you consent to receive transactional messages related to your orders, deliveries, account activity, and customer support.` },
      { type: 'p', text: `Message and data rates may apply.` },
      { type: 'h3', text: 'Information Sharing' },
      { type: 'p', text: `We do not sell, rent, or trade customer information.` },
      { type: 'p', text: `We share information only with service providers necessary to operate our business, including payment processors, delivery services, SMS providers, email providers, and as required by law.` },
      { type: 'h3', text: 'Your Rights' },
      { type: 'p', text: `You may request access to, correction of, or deletion of your personal information by contacting us.` },
    ],
  },
  {
    id: 'terms',
    icon: 'fa-file-contract',
    title: 'Terms of Service',
    summary: 'Orders, liability, chargebacks, and policy changes.',
    blocks: [
      { type: 'p', text: `By using Halaliy or placing an order, you agree to these terms.` },
      { type: 'h3', text: 'Orders & Payments' },
      { type: 'p', text: `Orders are confirmed only after full payment has been received or, in the case of shared-animal orders, after all participants have completed payment.` },
      { type: 'p', text: `Prices, availability, delivery dates, and product offerings may change without notice.` },
      { type: 'h3', text: 'Customer Responsibilities' },
      { type: 'p', text: `Customers are responsible for providing accurate contact and delivery information and for ensuring proper storage and handling of products after delivery.` },
      { type: 'h3', text: 'Limitation of Liability' },
      { type: 'p', text: `To the maximum extent permitted by law, Halaliy's total liability for any claim relating to an order shall not exceed the amount paid for that order.` },
      { type: 'h3', text: 'Chargebacks' },
      { type: 'p', text: `Customers agree to contact Halaliy before initiating a chargeback or payment dispute so that we have an opportunity to resolve the issue.` },
      { type: 'p', text: `Halaliy reserves the right to dispute fraudulent or improper chargebacks using payment records, delivery records, communications, photographs, GPS data, and other proof of fulfillment.` },
      { type: 'h3', text: 'Website Availability' },
      { type: 'p', text: `While we strive to maintain uninterrupted service, Halaliy does not guarantee that the website or services will always be available or error-free.` },
      { type: 'h3', text: 'Changes to Policies' },
      { type: 'p', text: `Halaliy may update these policies and terms from time to time.` },
      { type: 'p', text: `Updated versions will be posted on this page and become effective upon publication.` },
    ],
  },
];

/* -------------------------------- rendering ------------------------------- */

function PolicyBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === 'h3')
          return <h3 key={i} className="font-display font-bold text-slate-800 text-base mt-6 mb-2 first:mt-0">{b.text}</h3>;
        if (b.type === 'h4')
          return <h4 key={i} className="font-semibold text-green-700 text-xs uppercase tracking-wide mt-4 mb-1.5">{b.text}</h4>;
        if (b.type === 'ul')
          return (
            <ul key={i} className="space-y-1.5 my-2">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5 text-sm text-slate-600">
                  <i className="fa-solid fa-circle-check text-green-600 mt-1 text-xs flex-shrink-0"></i>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        return <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3">{b.text}</p>;
      })}
    </div>
  );
}

function Accordion({
  items,
  defaultOpen,
}: {
  items: { id: string; head: React.ReactNode; body: React.ReactNode }[];
  defaultOpen?: string;
}) {
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
              <i className={`fa-solid fa-chevron-down text-slate-400 text-sm ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            {isOpen && <div className="px-5 pb-5 pt-1 animate-fadeIn">{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- component ------------------------------- */

export default function PolicyPage() {
  return (
    <div className="animate-fadeIn bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 via-green-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display font-black text-4xl md:text-5xl mb-5 leading-tight">Policies &amp; FAQs</h1>
          <p className="text-green-100/90 text-lg mb-3">
            Everything you need to know about ordering fresh halal meat from Halaliy.
          </p>
          <p className="text-green-100/70 text-base max-w-2xl mx-auto">
            Whether you’re ordering a whole goat, sheep, cow share, or specialty cuts, we’ve made our
            policies simple, transparent, and easy to understand.
          </p>

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

      <div className="max-w-4xl mx-auto px-4 py-14">
        {/* Quick Answers */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-bolt text-green-600"></i>
            <h2 className="font-display font-black text-2xl text-slate-800">Quick Answers</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">The questions customers ask us most.</p>
          <Accordion
            defaultOpen="faq-0"
            items={QUICK_FAQS.map((f, i) => ({
              id: `faq-${i}`,
              head: <div className="font-semibold text-slate-800 text-sm pr-2">{f.q}</div>,
              body: <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>,
            }))}
          />
        </div>

        {/* Divider */}
        <div className="text-center my-12">
          <div className="inline-flex items-center gap-3 text-slate-400 text-sm">
            <span className="h-px w-10 bg-slate-200"></span>
            <span>Need more details? View our complete policies below.</span>
            <span className="h-px w-10 bg-slate-200"></span>
          </div>
        </div>

        {/* Detailed Policies */}
        <div className="mb-14">
          <h2 className="font-display font-black text-2xl text-slate-800 mb-1">Detailed Policies</h2>
          <p className="text-slate-500 text-sm mb-6">Tap any section to expand it.</p>
          <Accordion
            items={DETAILED.map((p) => ({
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
              body: <PolicyBlocks blocks={p.blocks} />,
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
            Real people, right here in Houston. We’re happy to help before or after you order — we
            usually reply the same day.
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
