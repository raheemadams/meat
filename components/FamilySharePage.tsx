import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '../constants';

const STEPS = [
  { icon: 'fa-cow', title: 'Pick a whole animal', desc: 'Choose a whole goat or cow. We handle sourcing, zabiha slaughter, and cutting.' },
  { icon: 'fa-user-group', title: 'Invite your family & friends', desc: 'Add each person at checkout. Everyone gets their own secure payment link by text.' },
  { icon: 'fa-credit-card', title: 'Everyone pays their share', desc: 'No chasing anyone for money. Once all shares are paid, your order is confirmed.' },
  { icon: 'fa-truck-fast', title: 'Delivered fresh, split up', desc: 'We deliver to the host on your chosen day — fresh, never frozen-shipped.' },
];

const SHARES = [
  { animal: 'Whole Goat', total: '$479', ways: 'up to 4 families', per: '~$129 each', note: '+ delivery, split too' },
  { animal: 'Whole Cow', total: '$1,800', ways: 'up to 7 families', per: '~$262 each', note: '+ delivery, split too' },
];

const FAQS = [
  { q: 'What if someone drops out of the group?', a: "No problem — you can adjust the number of shares before the order is confirmed, or invite someone else. The order only confirms once all shares are paid." },
  { q: 'Is the meat really halal?', a: 'Yes. Every animal is sourced from trusted local farms and hand-slaughtered to Islamic zabiha standards. Fresh, never frozen-shipped from out of state.' },
  { q: 'How is the meat divided?', a: 'The whole animal is cut and packaged, and delivered to the host (the person who started the order) to share with the group. Tell us your cutting preferences at checkout.' },
  { q: 'Where do you deliver?', a: 'Throughout the Greater Houston metro — Houston, Sugar Land, Katy, Pearland and surrounding areas. You pick the delivery date and window.' },
];

export default function FamilySharePage() {
  return (
    <div className="animate-fadeIn bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 via-green-900 to-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-green-300 text-xs font-bold tracking-widest uppercase mb-4">Family Share</span>
          <h1 className="font-display font-black text-4xl md:text-5xl mb-5 leading-tight">
            Split a whole goat or cow with your family.
          </h1>
          <p className="text-green-100/90 text-lg max-w-2xl mx-auto mb-8">
            A whole cow is $1,800 — too much for one family, perfect for seven. Order together,
            invite family and friends, and <strong>everyone pays only their share</strong>. Fresh,
            halal, delivered across Greater Houston.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="bg-white text-green-800 font-bold px-7 py-3.5 rounded-xl hover:bg-green-50 transition-colors">
              Browse Animals →
            </Link>
            <a href="#how" className="bg-white/10 border border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Founding Families offer */}
      <section className="bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm font-semibold flex items-center justify-center gap-2 flex-wrap">
          <i className="fa-solid fa-star text-green-200"></i>
          <span><strong>Founding Families:</strong> the first 50 customers get <strong>free delivery</strong> on their first order. Order now to claim it.</span>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-14">
        {/* How it works */}
        <div id="how" className="mb-16 scroll-mt-20">
          <h2 className="font-display font-black text-2xl text-slate-800 text-center mb-2">How Family Share works</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Four simple steps — no spreadsheets, no chasing payments.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700">
                    <i className={`fa-solid ${s.icon} text-lg`}></i>
                  </div>
                  <span className="font-display font-black text-2xl text-slate-200">{i + 1}</span>
                </div>
                <h3 className="font-display font-bold text-slate-800 mb-1.5">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The math */}
        <div className="mb-16">
          <h2 className="font-display font-black text-2xl text-slate-800 text-center mb-2">The math that makes it easy</h2>
          <p className="text-slate-500 text-sm text-center mb-8">Splitting a whole animal turns a big number into an easy one.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {SHARES.map((s) => (
              <div key={s.animal} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                <h3 className="font-display font-black text-xl text-slate-800 mb-1">{s.animal}</h3>
                <p className="text-slate-400 text-sm mb-4">{s.total} · split {s.ways}</p>
                <p className="font-display font-black text-3xl text-green-700">{s.per}</p>
                <p className="text-slate-400 text-xs mt-1">{s.note}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-6">
            Looking for lamb? <a href={`mailto:${CONTACT_EMAIL}`} className="text-green-700 font-semibold">Message us</a> — we'll sort it out.
          </p>
        </div>

        {/* Trust strip */}
        <div className="mb-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: 'fa-certificate', title: '100% Zabiha Halal', desc: 'Hand-slaughtered to Islamic standards, from trusted local farms.' },
            { icon: 'fa-leaf', title: 'Fresh, not frozen', desc: 'Delivered fresh and local — not shipped frozen from out of state.' },
            { icon: 'fa-location-dot', title: 'Greater Houston', desc: 'Houston, Sugar Land, Katy, Pearland & surrounding areas.' },
          ].map((t) => (
            <div key={t.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700 mx-auto mb-3">
                <i className={`fa-solid ${t.icon} text-lg`}></i>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{t.title}</h3>
              <p className="text-slate-500 text-sm">{t.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="font-display font-black text-2xl text-slate-800 text-center mb-8">Questions families ask</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-1.5">{f.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-3xl p-10 text-center text-white">
          <h2 className="font-display font-black text-3xl mb-3">Ready to share an order?</h2>
          <p className="text-green-100/90 mb-7 max-w-md mx-auto">
            Pick your animal, invite your family, and let everyone pay their share. Fresh halal meat,
            delivered to your door in Houston.
          </p>
          <Link to="/" className="inline-block bg-white text-green-800 font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors">
            Start your order →
          </Link>
        </div>
      </div>
    </div>
  );
}
