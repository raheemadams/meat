import React from 'react';
import { AnimalConfig } from '../types';
import { ANIMAL_CONFIGS, BENEFITS, SLAUGHTER_FEE } from '../constants';
import AnimalSelector from './AnimalSelector';

interface Props {
  onSelectAnimal: (config: AnimalConfig) => void;
  isLoggedIn?: boolean;
}

export default function HomePage({ onSelectAnimal, isLoggedIn }: Props) {
  if (isLoggedIn) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-green-700 text-white py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display font-black text-2xl md:text-3xl mb-1">Shop Halal Meat</h1>
            <p className="text-green-200 text-sm">All animals locally raised, hand-selected, and halal slaughtered</p>
          </div>
        </div>
        <section className="py-10 bg-slate-50 min-h-screen">
          <div className="max-w-6xl mx-auto px-4">
            <AnimalSelector configs={ANIMAL_CONFIGS} onSelect={onSelectAnimal} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* ── Hero ── */}
      <section className="relative bg-slate-950 text-white overflow-hidden" style={{ minHeight: 560 }}>
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=60&w=1400)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 60%',
          }}
        />
        {/* Dark overlay with green tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-green-950/60" />

        {/* Decorative circle blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 flex flex-col md:flex-row items-center gap-10">
          {/* Left: text */}
          <div className="flex-1 max-w-xl">
            <span className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full mb-6 tracking-wide">
              <i className="fa-solid fa-certificate"></i>
              100% HALAL CERTIFIED · HOUSTON, TX
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl xl:text-6xl leading-[1.1] mb-5">
              Fresh Halal Meat,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                Shared & Delivered.
              </span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Order whole goats, cows, or bulk chicken from local Houston farms.
              Split the cost with friends and family, each person pays only their share.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#browse"
                className="bg-green-500 hover:bg-green-400 text-white font-bold px-7 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-500/30"
              >
                <i className="fa-solid fa-store"></i>
                Browse Animals
              </a>
              <a
                href="#how-it-works"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors flex items-center gap-2 border border-white/20 backdrop-blur-sm"
              >
                <i className="fa-solid fa-circle-play"></i>
                How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-white/10">
              {[
                { icon: 'fa-shield-halved', label: 'Halal Verified' },
                { icon: 'fa-users', label: 'Group Sharing' },
                { icon: 'fa-truck-fast', label: 'Same-Day Delivery' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-slate-300 text-sm">
                  <i className={`fa-solid ${b.icon} text-green-400`}></i>
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating price cards */}
          <div className="hidden lg:flex flex-col gap-4 flex-shrink-0">
            {ANIMAL_CONFIGS.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectAnimal(c)}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 flex items-center gap-4 text-left hover:bg-white/20 transition-all hover:scale-105 hover:shadow-xl cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={c.image} alt={c.type} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-display font-black text-white text-base">{c.type}</p>
                  <p className="text-green-300 text-sm font-semibold">
                    ${c.pricePerUnit.toLocaleString()}
                    {c.type === 'Chicken' ? '/bird' : ' whole'}
                  </p>
                  {c.canShare && (
                    <p className="text-slate-400 text-xs">{c.sharingLabel}</p>
                  )}
                </div>
                <i className="fa-solid fa-arrow-right text-slate-400 ml-2"></i>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-green-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '500+', label: 'Families Served' },
            { n: '100%', label: 'Halal Certified' },
            { n: '3', label: 'Animal Types' },
            { n: '7', label: 'Max Share Splits' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display font-black text-3xl">{s.n}</p>
              <p className="text-green-200 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="bg-white py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display font-black text-3xl text-slate-800 mb-2">Why Choose Us?</h2>
            <p className="text-slate-400 text-sm">Houston's most trusted halal meat delivery service</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => {
              const colors = [
                'from-green-500 to-emerald-600',
                'from-blue-500 to-cyan-600',
                'from-amber-500 to-orange-600',
                'from-purple-500 to-violet-600',
              ];
              return (
                <div
                  key={b.title}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[i]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <i className={`fa-solid ${b.icon} text-white text-xl`}></i>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1">{b.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        className="py-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)' }}
      >
        {/* Decorative dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Step by step</span>
            <h2 className="font-display font-black text-3xl text-white mt-2 mb-2">How Group Sharing Works</h2>
            <p className="text-slate-400">Split a whole animal with up to 7 families in minutes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
            {[
              { n: '01', icon: 'fa-hand-pointer', title: 'Choose an Animal', desc: 'Select goat, cow, or bulk chicken and set your quantity.', color: 'from-green-400 to-emerald-500' },
              { n: '02', icon: 'fa-fire', title: 'Pick Processing Style', desc: `Choose skin burnt (+$${SLAUGHTER_FEE}) or standard clean skinning — available for goat and cow.`, color: 'from-orange-400 to-amber-500' },
              { n: '03', icon: 'fa-users', title: 'Split the Cost', desc: "Optionally add co-buyers — each gets their own payment link via SMS.", color: 'from-blue-400 to-cyan-500' },
              { n: '04', icon: 'fa-truck-fast', title: 'Single Delivery', desc: 'Everything delivered to one address on your chosen date.', color: 'from-purple-400 to-violet-500' },
            ].map((step, i) => (
              <div key={step.n} className="flex">
                <div className="flex flex-col w-full bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 hover:bg-white/10 transition-all hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-lg flex-shrink-0`}>
                    <i className={`fa-solid ${step.icon} text-white text-xl`}></i>
                  </div>
                  <span className="text-xs font-bold text-slate-500 tracking-widest">{step.n}</span>
                  <h3 className="font-bold text-white mt-1 mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Animal Selector ── */}
      <section id="browse" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-green-600 text-xs font-bold tracking-widest uppercase">Halal Certified</span>
            <h2 className="font-display font-black text-3xl text-slate-800 mt-2 mb-2">Choose Your Animal</h2>
            <p className="text-slate-500 text-sm">All animals locally raised, hand-selected, and halal slaughtered</p>
          </div>
          <AnimalSelector configs={ANIMAL_CONFIGS} onSelect={onSelectAnimal} />
        </div>
      </section>

      {/* ── Skin processing feature ── */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">Goat &amp; Cow Orders</span>
            <h2 className="font-display font-black text-2xl text-slate-800 mt-2 mb-2">How Would You Like It Processed?</h2>
            <p className="text-slate-500 text-sm">A standalone option you choose at checkout — no sharing required</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-fire text-orange-500 text-2xl"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-black text-slate-800 text-lg">Skin Burnt</h3>
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">+${SLAUGHTER_FEE}</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Traditional flame-based skin removal. Culturally preferred by many communities for its distinct texture and authentic preparation.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-droplet text-slate-400 text-2xl"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-black text-slate-800 text-lg">Standard Skinning</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Included</span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Clean, professional skin removal at no extra charge. Consistent results — included in every order at no additional cost.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20 overflow-hidden bg-slate-900">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=60&w=1400)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/50" />
        <div className="relative max-w-2xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-6 shadow-lg shadow-green-500/40">
            <i className="fa-solid fa-drumstick-bite text-white text-2xl"></i>
          </div>
          <h2 className="font-display font-black text-4xl mb-4">Ready to Order?</h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Join hundreds of Houston families sharing halal meat orders.
            Affordable, transparent, and community-driven.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#browse"
              className="bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/30 hover:shadow-green-400/40"
            >
              Browse Animals
            </a>
            <a
              href="#how-it-works"
              className="border border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
