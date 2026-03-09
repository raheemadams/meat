import React from 'react';
import { AnimalConfig } from '../types';
import { SLAUGHTER_FEE } from '../constants';

interface Props {
  configs: AnimalConfig[];
  onSelect: (config: AnimalConfig) => void;
}

const CARD_ACCENTS: Record<string, { gradient: string; badge: string; ring: string }> = {
  Goat:    { gradient: 'from-amber-500/10 to-orange-600/5', badge: 'bg-amber-50 text-amber-700 border-amber-200', ring: 'hover:ring-amber-400/30' },
  Cow:     { gradient: 'from-slate-500/10 to-slate-600/5',  badge: 'bg-slate-100 text-slate-700 border-slate-300', ring: 'hover:ring-slate-400/30' },
  Chicken: { gradient: 'from-yellow-400/10 to-amber-500/5', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', ring: 'hover:ring-yellow-400/30' },
};

export default function AnimalSelector({ configs, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {configs.map((config) => (
        <AnimalCard key={config.id} config={config} onSelect={onSelect} />
      ))}
    </div>
  );
}

function AnimalCard({ config, onSelect }: { config: AnimalConfig; onSelect: (c: AnimalConfig) => void }) {
  const accent = CARD_ACCENTS[config.type] ?? CARD_ACCENTS['Goat'];

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ring-4 ring-transparent ${accent.ring} flex flex-col`}
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={config.image}
          alt={config.type}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <i className="fa-solid fa-certificate text-xs"></i>
            HALAL ✓
          </span>
          {!config.canShare && (
            <span className="bg-slate-900/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              Min {config.minQuantity} birds
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute bottom-3 right-3 bg-white rounded-xl px-3 py-1.5 shadow-lg">
          <span className="font-display font-black text-green-700 text-lg leading-none">
            ${config.pricePerUnit.toLocaleString()}
          </span>
          <span className="text-slate-400 text-xs block text-right leading-none">
            {config.type === 'Chicken' ? '/bird' : '/whole'}
          </span>
        </div>

        {/* Animal name */}
        <div className="absolute bottom-3 left-3">
          <h3 className="font-display font-black text-white text-2xl drop-shadow-md">{config.type}</h3>
        </div>
      </div>

      {/* Body */}
      <div className={`flex flex-col flex-1 bg-gradient-to-b ${accent.gradient} p-5`}>
        {/* Sharing badge */}
        <div className="mb-3">
          {config.canShare ? (
            <span className={`inline-flex items-center gap-1.5 border text-xs font-bold px-2.5 py-1 rounded-full ${accent.badge}`}>
              <i className="fa-solid fa-users text-xs"></i>
              {config.sharingLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
              <i className="fa-solid fa-user text-xs"></i>
              Individual orders only
            </span>
          )}
        </div>

        <p className="text-slate-600 text-sm leading-relaxed flex-1 line-clamp-3">{config.description}</p>

        <div className="border-t border-slate-200/60 my-4" />

        {/* Feature list */}
        <div className="space-y-1.5 mb-4">
          {config.canShare && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <i className="fa-solid fa-circle-check text-green-500 w-3"></i>
              Up to {config.maxShares} people split the cost
            </div>
          )}
          {config.type !== 'Chicken' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <i className="fa-solid fa-fire text-orange-400 w-3"></i>
              Skin burnt (+${SLAUGHTER_FEE}) or standard — your choice
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <i className="fa-solid fa-circle-check text-green-500 w-3"></i>
            Single delivery to one address
          </div>
          {!config.canShare && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <i className="fa-solid fa-circle-check text-green-500 w-3"></i>
              Minimum {config.minQuantity} birds per order
            </div>
          )}
        </div>

        <button
          onClick={() => onSelect(config)}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-2xl transition-all text-sm shadow-sm hover:shadow-md hover:shadow-green-700/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-cart-plus"></i>
          Order {config.type}
        </button>
      </div>
    </div>
  );
}
