import { CONTACT_EMAIL, BUSINESS_NAME } from '../constants';

const UPDATED = 'June 9, 2026';

interface Section {
  id: string;
  title: string;
  icon: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'refunds',
    title: 'Refund & Cancellation Policy',
    icon: 'fa-rotate-left',
    body: (
      <>
        <p>
          Because our products are fresh, perishable halal meat prepared to order, cancellations are
          time-sensitive. You may request a cancellation any time <strong>before your order moves to
          “Slaughter Scheduled.”</strong> Once an order is scheduled or processed, it can no longer be
          cancelled, as the animal has been committed to your order.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>
            <strong>Card payments:</strong> approved cancellations are refunded automatically to your
            original card. Refunds typically appear within 5–10 business days, depending on your bank.
          </li>
          <li>
            <strong>Zelle payments:</strong> refunds are processed manually. We will contact you to
            arrange the return of your funds.
          </li>
          <li>
            <strong>Group / split orders:</strong> if an order is cancelled, each contributor who paid
            by card is refunded their share automatically.
          </li>
        </ul>
        <p>
          If something is wrong with your delivered order (quality, quantity, or a mistake on our part),
          contact us within <strong>24 hours of delivery</strong> and we will make it right with a
          replacement or refund.
        </p>
      </>
    ),
  },
  {
    id: 'delivery',
    title: 'Delivery Policy',
    icon: 'fa-truck-fast',
    body: (
      <>
        <p>
          We deliver throughout the <strong>Greater Houston metropolitan area</strong>. At checkout you
          choose a delivery date and time window. Someone must be available at the delivery address
          during the selected window to receive your order, as it is fresh meat that should not be left
          unattended.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>You will receive SMS and email updates as your order progresses to delivery.</li>
          <li>
            If we are unable to deliver because no one is available, we will contact you to reschedule.
            Additional charges may apply for repeat delivery attempts.
          </li>
          <li>Please ensure your delivery address and phone number are accurate when ordering.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'halal',
    title: 'Halal & Quality Assurance',
    icon: 'fa-certificate',
    body: (
      <>
        <p>
          All {BUSINESS_NAME} meat is sourced from local farms and prepared according to Islamic halal
          guidelines. We are committed to ethically raised animals and clean, careful handling from farm
          to your door. If you have specific questions about sourcing or preparation, please reach out —
          we’re happy to share details.
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'fa-lock',
    body: (
      <>
        <p>
          We collect only the information needed to process and deliver your orders — your name, email,
          phone number, delivery address, and order details. We use it to fulfill orders, send order
          and delivery notifications, and provide support.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>
            <strong>Payments</strong> are processed securely by Stripe (cards) or Zelle. We never store
            your full card number on our servers.
          </li>
          <li>
            We do <strong>not</strong> sell or rent your personal information to third parties.
          </li>
          <li>
            We share information only with the service providers needed to run {BUSINESS_NAME} (e.g.,
            payment, SMS, and email providers) and as required by law.
          </li>
          <li>
            You may request access to or deletion of your account information at any time by emailing us.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: 'fa-file-contract',
    body: (
      <>
        <p>
          By placing an order with {BUSINESS_NAME}, you agree to provide accurate information and to pay
          the total shown at checkout, including any applicable slaughter and delivery fees. Prices and
          product availability may change without notice.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 my-2">
          <li>Orders are confirmed once payment (or all shares of a split order) is received.</li>
          <li>
            You are responsible for ensuring the meat is handled and stored safely after delivery.
          </li>
          <li>
            {BUSINESS_NAME} is not liable for issues arising from improper storage or handling after a
            successful delivery.
          </li>
        </ul>
      </>
    ),
  },
];

export default function PolicyPage() {
  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-green-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display font-black text-4xl mb-3">Our Policies</h1>
          <p className="text-slate-300 text-lg">Clear terms for ordering, delivery, refunds, and privacy.</p>
          <p className="text-slate-400 text-sm mt-3">Last updated {UPDATED}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Table of contents */}
        <nav className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">On this page</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg px-3 py-2 transition-colors"
              >
                <i className={`fa-solid ${s.icon} text-green-700 w-4`}></i>
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700">
                  <i className={`fa-solid ${s.icon}`}></i>
                </div>
                <h2 className="font-display font-black text-xl text-slate-800">{s.title}</h2>
              </div>
              <div className="policy-body text-slate-600 text-sm leading-relaxed space-y-3">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        {/* Contact callout */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <h3 className="font-semibold text-green-900 mb-1">Questions about any of this?</h3>
          <p className="text-green-700 text-sm mb-4">We’re happy to help — reach out any time.</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-block bg-green-700 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            <i className="fa-solid fa-envelope mr-2"></i>
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
