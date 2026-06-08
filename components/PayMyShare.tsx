import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BUSINESS_NAME, ZELLE_INFO } from '../constants';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
const FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

interface Share {
  order: {
    id: string; animalType: string; quantity: number; skinOption: string;
    shares: number; totalPrice: number | null;
    deliveryAddress: string; deliveryDate: string; deliveryWindow: string; status: string;
  };
  owner: { name: string; amount: number; isPaid: boolean };
}

async function callFn(name: string, body: unknown) {
  const res = await fetch(`${FN}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ── Stripe card form ──────────────────────────────────────────────────────────
interface CardHandle { pay: (token: string) => Promise<{ ok: true } | { error: string }>; }

const CardForm = forwardRef<CardHandle, { onErr: (m: string) => void }>(({ onErr }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  useImperativeHandle(ref, () => ({
    async pay(token) {
      if (!stripe || !elements) return { error: 'Payment form still loading — try again.' };
      const intent = await callFn('pay-share', { token, action: 'create_intent' });
      if (!intent.ok) return { error: intent.data?.error === 'already_paid' ? 'This share is already paid.' : 'Could not start payment.' };
      const card = elements.getElement(CardElement);
      if (!card) return { error: 'Card form not ready.' };
      const { paymentIntent, error } = await stripe.confirmCardPayment(intent.data.clientSecret, { payment_method: { card } });
      if (error) return { error: error.message ?? 'Payment declined.' };
      const confirm = await callFn('pay-share', { token, action: 'confirm', paymentIntentId: paymentIntent!.id });
      if (!confirm.ok) return { error: 'Payment captured but confirmation failed — contact support.' };
      return { ok: true };
    },
  }));
  return (
    <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
      <CardElement
        options={{ style: { base: { fontSize: '14px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } }, invalid: { color: '#dc2626' } } }}
        onChange={(e) => onErr(e.error?.message ?? '')}
      />
    </div>
  );
});

export default function PayMyShare() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<Share | null>(null);
  const [method, setMethod] = useState<'card' | 'zelle'>('card');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cardErr, setCardErr] = useState('');
  const [err, setErr] = useState('');
  const cardRef = useRef<CardHandle>(null);

  useEffect(() => {
    (async () => {
      if (!token) { setLoading(false); return; }
      const { ok, data } = await callFn('get-share', { token });
      if (ok) { setShare(data); setPaid(!!data.owner?.isPaid); }
      setLoading(false);
    })();
  }, [token]);

  async function handleCardPay() {
    setErr(''); setPaying(true);
    const res = cardRef.current ? await cardRef.current.pay(token!) : { error: 'Not ready' };
    if ('error' in res) setErr(res.error);
    else setPaid(true);
    setPaying(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><i className="fa-solid fa-spinner fa-spin text-green-700 text-2xl" /></div>;
  }

  if (!share) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-link-slash text-2xl text-red-500" />
        </div>
        <h2 className="font-display font-black text-2xl text-slate-800 mb-2">Link Not Found</h2>
        <p className="text-slate-500 text-sm">This payment link is invalid or has expired. Please contact the order organizer.</p>
      </div>
    );
  }

  const { order, owner } = share;

  if (paid) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fa-solid fa-circle-check text-3xl text-green-600" />
        </div>
        <h2 className="font-display font-black text-2xl text-slate-800 mb-2">Payment Complete!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your share of <strong>${owner.amount.toFixed(2)}</strong> for the group {order.animalType} order is confirmed.
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
      <div className="text-center mb-8">
        <img src="/logo-mark.png" alt={BUSINESS_NAME} className="w-14 h-14 mx-auto mb-4 rounded-2xl" />
        <h1 className="font-display font-black text-2xl text-slate-800">{BUSINESS_NAME}</h1>
        <p className="text-slate-500 text-sm mt-1">Group Halal Order — Pay Your Share</p>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-green-700 px-5 py-4">
          <p className="text-green-100 text-xs font-medium">Hello, {owner.name}!</p>
          <p className="text-white text-lg font-bold mt-0.5">You've been added to a group order.</p>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <Detail label="Order ID" value={order.id} />
          <Detail label="Item" value={`${order.quantity} ${order.animalType}${order.quantity > 1 ? 's' : ''}`} />
          <Detail label="Delivery to" value={order.deliveryAddress} />
          <Detail label="Delivery date" value={`${order.deliveryDate} · ${order.deliveryWindow}`} />
          {order.totalPrice != null && <Detail label="Total order" value={`$${order.totalPrice.toFixed(2)}`} />}
          <Detail label="Shares" value={`${order.shares} people`} />
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-slate-800">Your share</span>
            <span className="font-display font-black text-green-700 text-2xl">${owner.amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment method tabs */}
      <div className="flex gap-2 mb-4">
        {(['card', 'zelle'] as const).map((m) => (
          <button key={m} onClick={() => { setMethod(m); setErr(''); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
              method === m ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-green-300'}`}>
            <i className={`fa-solid ${m === 'card' ? 'fa-credit-card' : 'fa-building-columns'} mr-1.5`} />
            {m === 'card' ? 'Pay by Card' : 'Pay by Zelle'}
          </button>
        ))}
      </div>

      {method === 'card' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-5 space-y-4">
          <Elements stripe={stripePromise}>
            <CardForm ref={cardRef} onErr={setCardErr} />
            {cardErr && <p className="text-xs text-red-600">{cardErr}</p>}
            {err && <p className="text-xs text-red-600">{err}</p>}
            <button onClick={handleCardPay} disabled={paying}
              className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
              {paying ? <span><i className="fa-solid fa-spinner fa-spin mr-2" />Processing…</span> : `Pay $${owner.amount.toFixed(2)}`}
            </button>
            <p className="text-xs text-slate-400 text-center">Secure card payment via Stripe.</p>
          </Elements>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-5 space-y-3 text-sm">
          <p className="font-semibold text-slate-700">Pay by Zelle</p>
          <p className="text-slate-500">Send your share of <strong>${owner.amount.toFixed(2)}</strong> via Zelle to:</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 border border-slate-200">
            <Detail label="Zelle email" value={ZELLE_INFO.email} />
            <Detail label="Zelle phone" value={ZELLE_INFO.phone} />
            <Detail label="Name" value={ZELLE_INFO.businessName} />
            <Detail label="Reference" value={order.id} />
          </div>
          <p className="text-xs text-amber-600">
            <i className="fa-solid fa-circle-info mr-1" />
            Include the reference <strong>{order.id}</strong> so we can match your payment. Your share is marked paid once we confirm receipt.
          </p>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700 font-medium text-right">{value}</span>
    </div>
  );
}
