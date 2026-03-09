import React, { useState } from 'react';
import { APP_EMAIL, ZELLE_INFO } from '../constants';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:${APP_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-800 to-green-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display font-black text-4xl mb-3">Contact Us</h1>
          <p className="text-slate-300 text-lg">Questions about an order? We're here to help.</p>
        </div>
      </section>

      {/* Info cards */}
      <section className="bg-white border-b border-slate-100 py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: 'fa-location-dot', title: 'Service Area', desc: 'Greater Houston Metropolitan Area, TX', color: 'text-green-700' },
            { icon: 'fa-envelope', title: 'Email', desc: APP_EMAIL, color: 'text-blue-600' },
            { icon: 'fa-clock', title: 'Business Hours', desc: 'Mon–Sat: 8 AM – 6 PM\nSun: 9 AM – 4 PM', color: 'text-amber-600' },
          ].map((card) => (
            <div key={card.title} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
              <div className={`w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 ${card.color}`}>
                <i className={`fa-solid ${card.icon} text-lg`}></i>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{card.title}</h3>
              <p className="text-slate-500 text-sm whitespace-pre-line">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Zelle info */}
      <section className="py-10 bg-purple-50 border-b border-purple-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-mobile-screen text-purple-600 text-xl"></i>
          </div>
          <h2 className="font-display font-black text-xl text-slate-800 mb-2">Zelle Payments</h2>
          <p className="text-slate-500 text-sm mb-4">
            Send your Zelle transfer to the details below. Always include your order reference code.
          </p>
          <div className="bg-white rounded-xl p-4 border border-purple-200 text-sm space-y-1 inline-block text-left">
            <p><span className="text-slate-400">Business:</span> <strong>{ZELLE_INFO.businessName}</strong></p>
            <p><span className="text-slate-400">Email:</span> <strong>{ZELLE_INFO.email}</strong></p>
            <p><span className="text-slate-400">Phone:</span> <strong>{ZELLE_INFO.phone}</strong></p>
          </div>
        </div>
      </section>

      {/* Map + Contact form */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Map */}
          <div>
            <h2 className="font-display font-black text-xl text-slate-800 mb-4">Service Area</h2>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-64 md:h-80">
              <iframe
                title="Houston Service Area"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-95.9%2C29.5%2C-95.0%2C30.1&layer=mapnik"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">We deliver throughout the Greater Houston area.</p>
          </div>

          {/* Form */}
          <div>
            <h2 className="font-display font-black text-xl text-slate-800 mb-4">Send a Message</h2>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <i className="fa-solid fa-circle-check text-3xl text-green-600 mb-3"></i>
                <p className="font-semibold text-green-800">Message prepared!</p>
                <p className="text-green-600 text-sm mt-1">Your email client should open. Send the message to reach us.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jane Smith"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    placeholder="Tell us about your inquiry…"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  <i className="fa-solid fa-paper-plane mr-2"></i>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
