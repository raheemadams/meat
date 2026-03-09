import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Order, PortionOwner } from '../types';
import { BUSINESS_NAME } from '../constants';

interface Props {
  orders: Order[];
  onPaymentComplete: (orderId: string, paymentLinkToken: string) => void;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PayMyShare({ orders, onPaymentComplete, addToast }: Props) {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  // Find the order and owner by token
  const found = token
    ? (() => {
        for (const order of orders) {
          const owner = order.portionOwners.find((o) => o.paymentLinkToken === token);
          if (owner) return { order, owner };
        }
        return null;
      })()
    : null;

  useEffect(() => {
    // Simulate lookup delay
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  async function handlePay() {
    if (!found) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1200));
    onPaymentComplete(found.order.id, found.owner.paymentLinkToken);
    setPaid(true);
    setPaying(false);
    addToast('Payment complete! Thank you.', 'success');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <i className="fa-solid fa-spinner fa-spin text-green-700 text-2xl"></i>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-link-slash text-2xl text-red-500"></i>
        </div>
        <h2 className="font-display font-black text-2xl text-slate-800 mb-2">Link Not Found</h2>
        <p className="text-slate-500 text-sm">
          This payment link is invalid or has already been used. Contact the order organizer.
        </p>
      </div>
    );
  }

  const { order, owner } = found;

  if (owner.isPaid || paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-circle-check text-3xl text-green-600"></i>
        </div>
        <h2 className="font-display font-black text-2xl text-slate-800 mb-2">Payment Complete!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your payment of <strong>${owner.amount.toFixed(2)}</strong> for the group {order.animalType} order has been confirmed.
        </p>
        <div className="bg-green-50 rounded-xl p-4 text-sm text-slate-700 border border-green-200 text-left">
          <p><span className="text-slate-400">Order:</span> <strong>{order.id}</strong></p>
          <p className="mt-1"><span className="text-slate-400">Delivery:</span> {order.deliveryAddress}</p>
          <p className="mt-1"><span className="text-slate-400">Date:</span> {order.deliveryDate}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-drumstick-bite text-white text-2xl"></i>
        </div>
        <h1 className="font-display font-black text-2xl text-slate-800">{BUSINESS_NAME}</h1>
        <p className="text-slate-500 text-sm mt-1">Group Halal Order — Pay Your Share</p>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-green-700 px-5 py-4">
          <p className="text-green-100 text-xs font-medium">Hello, {owner.name}!</p>
          <p className="text-white text-lg font-bold mt-0.5">
            You've been added to a group order.
          </p>
        </div>

        <div className="px-5 py-4 space-y-3 text-sm">
          <Detail label="Order ID" value={order.id} />
          <Detail label="Animal" value={`${order.quantity} ${order.animalType}${order.quantity > 1 ? 's' : ''}`} />
          <Detail label="Processing" value={order.skinOption === 'BURNT' ? 'Skin Burnt' : 'Skin Not Burnt'} />
          <Detail label="Delivery to" value={order.deliveryAddress} />
          <Detail label="Delivery date" value={order.deliveryDate} />
          <Detail label="Total order" value={`$${order.pricing.totalPrice.toFixed(2)}`} />
          <Detail label="Shares" value={`${order.shares} people`} />
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Your share</span>
              <span className="font-display font-black text-green-700 text-2xl">${owner.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment form (simulated) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-5 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Payment Details (Simulated)</p>

        <input
          defaultValue="4242 4242 4242 4242"
          placeholder="Card Number"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            defaultValue="12/28"
            placeholder="MM/YY"
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            defaultValue="123"
            placeholder="CVV"
            className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <input
          defaultValue={owner.name}
          placeholder="Cardholder Name"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <p className="text-xs text-amber-600">
          <i className="fa-solid fa-triangle-exclamation mr-1"></i>
          Demo mode — no real charge will occur.
        </p>

        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {paying ? (
            <span><i className="fa-solid fa-spinner fa-spin mr-2"></i>Processing…</span>
          ) : (
            <span><i className="fa-solid fa-lock mr-2"></i>Pay ${owner.amount.toFixed(2)}</span>
          )}
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right max-w-48 truncate">{value}</span>
    </div>
  );
}
