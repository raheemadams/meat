import { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AnimalConfig, Order, PaymentMethod, PortionOwner, SkinOption, SubscriptionInterval } from '../types';
import { calculatePricing } from '../utils/pricing';
import { generateOrderId, generateToken, determineInitialStatus, getAvailableDates, formatDate } from '../utils/orderHelpers';
import { DELIVERY_WINDOWS, SLAUGHTER_FEE, ZELLE_INFO } from '../constants';
import { supabase } from '../supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

interface Props {
  config: AnimalConfig;
  user: User;
  onClose: () => void;
  onCreateOrder: (order: Order) => void;
  defaultAddress?: string;
}

interface ShareMember {
  name: string;
  phone: string;
}

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Configure', 'Share', 'Delivery', 'Payment'];

// ── Stripe card form ────────────────────────────────────────────────────────
interface CardFormHandle {
  confirmPayment: (amountCents: number, orderId: string) => Promise<{ paymentIntentId: string } | { error: string }>;
}

const CardForm = forwardRef<CardFormHandle, { onCardError: (msg: string) => void }>(
  ({ onCardError }, ref) => {
    const stripe = useStripe();
    const elements = useElements();

    useImperativeHandle(ref, () => ({
      async confirmPayment(amountCents, orderId) {
        if (!stripe || !elements) return { error: 'Stripe not ready — please try again.' };

        try {
          const { data: { session } } = await supabase.auth.getSession();

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token ?? ''}`,
              },
              body: JSON.stringify({ amount: amountCents, orderId }),
            },
          );

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            return { error: `Payment setup failed (${res.status})${text ? ': ' + text : ''}` };
          }

          const { clientSecret, error: fnError } = await res.json();
          if (fnError) return { error: fnError };

          const cardEl = elements.getElement(CardElement);
          if (!cardEl) return { error: 'Card form not ready.' };

          const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardEl },
          });

          if (error) return { error: error.message ?? 'Payment declined.' };
          return { paymentIntentId: paymentIntent!.id };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Payment failed. Please try again.' };
        }
      },
    }));

    return (
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: '#1e293b', '::placeholder': { color: '#94a3b8' } },
              invalid: { color: '#dc2626' },
            },
          }}
          onChange={(e) => onCardError(e.error?.message ?? '')}
        />
      </div>
    );
  },
);

// ── Main form ────────────────────────────────────────────────────────────────
export default function BookingForm({ config, user, onClose, onCreateOrder, defaultAddress = '' }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [quantity, setQuantity] = useState(config.minQuantity);
  const [skinOption, setSkinOption] = useState<SkinOption>('NOT_BURNT');
  const [enableSplit, setEnableSplit] = useState(false);

  // Subscription
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [subscriptionInterval, setSubscriptionInterval] = useState<SubscriptionInterval>(1);

  // Step 2
  const [shareCount, setShareCount] = useState(2);
  const [members, setMembers] = useState<ShareMember[]>([{ name: '', phone: '' }, { name: '', phone: '' }]);

  // Step 3
  const [address, setAddress] = useState(defaultAddress);
  const [useDifferentAddress, setUseDifferentAddress] = useState(!defaultAddress);
  const [deliveryDate, setDeliveryDate] = useState(getAvailableDates()[0]);
  const [deliveryWindow, setDeliveryWindow] = useState(DELIVERY_WINDOWS[0]);

  // Step 4
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [zelleConfirmed, setZelleConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [stripeError, setStripeError] = useState('');
  const cardFormRef = useRef<CardFormHandle>(null);

  const shares = config.canShare && enableSplit ? shareCount : 1;
  const pricing = useMemo(
    () => calculatePricing(config, quantity, skinOption, shares),
    [config, quantity, skinOption, shares]
  );

  const zelleRefCode = useMemo(() => `HMC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, []);
  const availableDates = useMemo(() => getAvailableDates(), []);

  // Adjust member array when shareCount changes
  function handleShareCountChange(n: number) {
    setShareCount(n);
    setMembers((prev) => {
      const next = [...prev];
      while (next.length < n - 1) next.push({ name: '', phone: '' });
      return next.slice(0, n - 1);
    });
  }

  function updateMember(idx: number, field: keyof ShareMember, value: string) {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  }

  function canAdvance(): boolean {
    if (step === 1) {
      return quantity >= config.minQuantity;
    }
    if (step === 2) {
      return members.slice(0, shareCount - 1).every((m) => m.name.trim() && isValidPhone(m.phone));
    }
    if (step === 3) {
      return address.trim().length > 3;
    }
    if (step === 4) {
      if (paymentMethod === 'ZELLE') return zelleConfirmed;
      return true;
    }
    return false;
  }

  function goNext() {
    if (!canAdvance()) return;
    // Skip step 2 if no split
    if (step === 1 && (!config.canShare || !enableSplit)) {
      setStep(3);
      return;
    }
    setStep((s) => (s + 1) as Step);
  }

  function goBack() {
    if (step === 3 && (!config.canShare || !enableSplit)) {
      setStep(1);
      return;
    }
    setStep((s) => (s - 1) as Step);
  }

  async function handleSubmit() {
    if (!canAdvance()) return;
    setSubmitting(true);
    setStripeError('');

    const orderId = generateOrderId();
    let paymentRef: string | undefined;

    if (paymentMethod === 'CARD') {
      setSubmitStatus('Processing payment…');
      const result = await cardFormRef.current?.confirmPayment(
        Math.round(pricing.perShareAmount * 100),
        orderId,
      );
      if (!result || 'error' in result) {
        setStripeError(result?.error ?? 'Payment failed.');
        setSubmitting(false);
        setSubmitStatus('');
        return;
      }
      paymentRef = result.paymentIntentId;
    }

    setSubmitStatus('Confirming order…');
    await new Promise((r) => setTimeout(r, 400));

    // Build portion owners
    const primaryOwner: PortionOwner = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
      name: user.user_metadata?.full_name ?? user.email ?? 'Primary',
      phone: user.user_metadata?.phone ?? '',
      isPaid: paymentMethod === 'CARD',
      amount: pricing.perShareAmount,
      isPrimary: true,
      paymentMethod,
      paymentRef,
      paymentLinkToken: generateToken(),
    };

    const secondaryOwners: PortionOwner[] = members.map((m, i) => ({
      id: `secondary-${i}-${Date.now()}`,
      name: m.name,
      phone: m.phone,
      isPaid: false,
      amount: pricing.perShareAmount,
      isPrimary: false,
      paymentLinkToken: generateToken(),
    }));

    const allOwners = shares > 1 ? [primaryOwner, ...secondaryOwners] : [primaryOwner];

    const order: Order = {
      id: orderId,
      userId: user.id,
      animalType: config.type,
      quantity,
      skinOption,
      shares,
      portionOwners: allOwners,
      pricing,
      deliveryAddress: address,
      deliveryDate,
      deliveryWindow,
      status: determineInitialStatus(paymentMethod, shares),
      paymentMethod,
      zelleRefCode: paymentMethod === 'ZELLE' ? zelleRefCode : undefined,
      timestamp: Date.now(),
      subscriptionInterval: enableSubscription ? subscriptionInterval : undefined,
    };

    onCreateOrder(order);
    setSubmitting(false);
  }

  const stepIndex = step === 1 ? 0 : step === 2 ? 1 : step === 3 ? 2 : 3;
  const effectiveSteps = config.canShare && enableSplit ? STEP_LABELS : ['Configure', 'Delivery', 'Payment'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-700 px-6 py-4 flex items-center justify-between sticky top-0 rounded-t-2xl z-10">
          <div>
            <h2 className="font-display text-white text-lg font-bold">Order {config.type}</h2>
            <p className="text-green-200 text-xs">
              Step {stepIndex + 1} of {effectiveSteps.length} — {effectiveSteps[stepIndex]}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-green-100">
          <div
            className="h-1 bg-green-600 transition-all"
            style={{ width: `${((stepIndex + 1) / effectiveSteps.length) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* ── Step 1: Configure ── */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Quantity{config.type === 'Chicken' ? ` (min ${config.minQuantity})` : ''}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(config.minQuantity, q - 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-green-400 transition-colors text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-display font-black text-2xl text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-green-400 transition-colors text-lg font-bold"
                  >
                    +
                  </button>
                </div>
                {config.type === 'Chicken' && (
                  <p className="text-xs text-slate-400 mt-1">Minimum {config.minQuantity} chickens per order</p>
                )}
              </div>

              {/* Skin option — not applicable for Chicken */}
              {config.type !== 'Chicken' && (
                <div
                  className={`border rounded-xl p-4 transition-colors ${
                    skinOption === 'BURNT' ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <i className={`fa-solid fa-fire text-sm ${skinOption === 'BURNT' ? 'text-orange-500' : 'text-slate-400'}`}></i>
                        <p className="font-semibold text-slate-800 text-sm">Skin Burnt</p>
                        {skinOption === 'BURNT' && (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            +${SLAUGHTER_FEE}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {skinOption === 'BURNT'
                          ? 'Traditional flame-based skin removal'
                          : 'Standard clean skinning — included'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSkinOption((s) => (s === 'BURNT' ? 'NOT_BURNT' : 'BURNT'))}
                      className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                        skinOption === 'BURNT' ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                          skinOption === 'BURNT' ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Split toggle — only for shareable animals */}
              {config.canShare && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Split with Others</p>
                      <p className="text-xs text-slate-500 mt-0.5">{config.sharingLabel}</p>
                    </div>
                    <button
                      onClick={() => setEnableSplit((s) => !s)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        enableSplit ? 'bg-green-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                          enableSplit ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Subscription toggle */}
              <div className={`border rounded-xl p-4 transition-colors ${enableSubscription ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid fa-rotate text-sm ${enableSubscription ? 'text-blue-600' : 'text-slate-400'}`}></i>
                      <p className="font-semibold text-slate-800 text-sm">Recurring Order</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Auto-repeat this order on a schedule</p>
                  </div>
                  <button
                    onClick={() => setEnableSubscription((s) => !s)}
                    className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enableSubscription ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${enableSubscription ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
                {enableSubscription && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {([1, 2, 3] as SubscriptionInterval[]).map((n) => (
                      <button
                        key={n}
                        onClick={() => setSubscriptionInterval(n)}
                        className={`py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                          subscriptionInterval === n
                            ? 'border-blue-500 bg-blue-100 text-blue-800'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        {n === 1 ? 'Every month' : `Every ${n} months`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price preview */}
              <PriceBreakdown pricing={pricing} shares={shares} skinOption={skinOption} />
            </div>
          )}

          {/* ── Step 2: Share Members ── */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Number of Shares (including you)
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleShareCountChange(Math.max(2, shareCount - 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-green-400 text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-display font-black text-2xl text-slate-800">
                    {shareCount}
                  </span>
                  <button
                    onClick={() => handleShareCountChange(Math.min(config.maxShares, shareCount + 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center hover:border-green-400 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Max {config.maxShares} shares for {config.type}</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                <span className="font-semibold text-green-800">Each person pays:</span>{' '}
                <span className="text-green-700 font-display font-black text-lg">${pricing.perShareAmount.toFixed(2)}</span>
                <span className="text-green-600"> (total ${pricing.totalPrice.toFixed(2)} ÷ {shareCount})</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Co-purchasers (enter {shareCount - 1} person{shareCount - 1 > 1 ? 's' : ''})
                </p>
                <div className="space-y-3">
                  {members.slice(0, shareCount - 1).map((m, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Person {i + 2}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={m.name}
                          onChange={(e) => updateMember(i, 'name', e.target.value)}
                          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone Number"
                            value={m.phone}
                            onChange={(e) => updateMember(i, 'phone', e.target.value)}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
                              m.phone && !isValidPhone(m.phone)
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-200'
                            }`}
                          />
                          {m.phone && !isValidPhone(m.phone) && (
                            <p className="text-xs text-red-500 mt-1">Enter a valid 10-digit number</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-400">
                <i className="fa-solid fa-info-circle mr-1"></i>
                A payment link will be sent to each person's phone number. They don't need an account.
              </p>
            </div>
          )}

          {/* ── Step 3: Delivery ── */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Delivery Address (Houston area only)
                </label>
                {defaultAddress && !useDifferentAddress ? (
                  <div className="border border-green-300 bg-green-50 rounded-xl px-4 py-3 text-sm text-slate-800 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">From your profile</p>
                      <p className="font-medium">{defaultAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUseDifferentAddress(true); setAddress(''); }}
                      className="text-xs text-green-700 underline whitespace-nowrap hover:text-green-900 flex-shrink-0 mt-1"
                    >
                      Use different
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St, Houston, TX 77002"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                    {defaultAddress && (
                      <button
                        type="button"
                        onClick={() => { setUseDifferentAddress(false); setAddress(defaultAddress); }}
                        className="text-xs text-green-700 underline mt-1.5 hover:text-green-900"
                      >
                        Use profile address instead
                      </button>
                    )}
                  </div>
                )}
                {shares > 1 && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    <i className="fa-solid fa-circle-info mr-1"></i>
                    All portions will be delivered to this single address. Your group will distribute amongst themselves.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Date</label>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDeliveryDate(d)}
                      className={`py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all text-center ${
                        deliveryDate === d
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {formatDate(d)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Delivery Window</label>
                <div className="space-y-2">
                  {DELIVERY_WINDOWS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setDeliveryWindow(w)}
                      className={`w-full py-2.5 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                        deliveryWindow === w
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {deliveryWindow === w && <i className="fa-solid fa-circle-check text-green-500 mr-2"></i>}
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Payment ── */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <PriceBreakdown pricing={pricing} shares={shares} skinOption={skinOption} />

              {shares > 1 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  <i className="fa-solid fa-users mr-2"></i>
                  You are paying <strong>${pricing.perShareAmount.toFixed(2)}</strong> for your share.
                  The other {shares - 1} member{shares - 1 > 1 ? 's' : ''} will receive payment links.
                </div>
              )}

              {/* Payment method toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {([['CARD', 'fa-credit-card', 'Credit / Debit Card'], ['ZELLE', 'fa-mobile-screen', 'Zelle Transfer']] as const).map(
                    ([val, icon, label]) => (
                      <button
                        key={val}
                        onClick={() => setPaymentMethod(val)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 justify-center font-medium text-sm ${
                          paymentMethod === val
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <i className={`fa-solid ${icon}`}></i>
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {paymentMethod === 'CARD' && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Card Details</p>
                  <Elements stripe={stripePromise}>
                    <CardForm ref={cardFormRef} onCardError={setStripeError} />
                  </Elements>
                  {stripeError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <i className="fa-solid fa-circle-exclamation"></i>
                      {stripeError}
                    </p>
                  )}
                </div>
              )}

              {paymentMethod === 'ZELLE' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-purple-800">Send Zelle to:</p>
                  <div className="bg-white rounded-lg p-3 border border-purple-100 space-y-1">
                    <p className="text-sm"><span className="text-slate-400">Business:</span> <strong>{ZELLE_INFO.businessName}</strong></p>
                    <p className="text-sm"><span className="text-slate-400">Email:</span> <strong>{ZELLE_INFO.email}</strong></p>
                    <p className="text-sm"><span className="text-slate-400">Phone:</span> <strong>{ZELLE_INFO.phone}</strong></p>
                    <p className="text-sm"><span className="text-slate-400">Amount:</span> <strong className="text-green-700">${pricing.perShareAmount.toFixed(2)}</strong></p>
                    <p className="text-sm">
                      <span className="text-slate-400">Ref Code:</span>{' '}
                      <strong className="font-mono text-purple-700">{zelleRefCode}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-purple-600">
                    Include the reference code in your Zelle memo. An admin will verify your payment.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zelleConfirmed}
                      onChange={(e) => setZelleConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-purple-600"
                    />
                    <span className="text-sm text-slate-700">
                      I have sent ${pricing.perShareAmount.toFixed(2)} via Zelle with reference code{' '}
                      <strong className="font-mono">{zelleRefCode}</strong>.
                    </span>
                  </label>
                </div>
              )}

              {submitStatus && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  {submitStatus}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
            {step > 1 && (
              <button
                onClick={goBack}
                disabled={submitting}
                className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <i className="fa-solid fa-arrow-left mr-1.5"></i>
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={goNext}
                disabled={!canAdvance()}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Continue
                <i className="fa-solid fa-arrow-right ml-1.5"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canAdvance()}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <span><i className="fa-solid fa-spinner fa-spin mr-1.5"></i>{submitStatus || 'Processing…'}</span>
                ) : (
                  <span><i className="fa-solid fa-check mr-1.5"></i>Place Order</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceBreakdown({
  pricing,
  shares,
  skinOption,
}: {
  pricing: ReturnType<typeof calculatePricing>;
  shares: number;
  skinOption: SkinOption;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
      <p className="font-semibold text-slate-700 mb-2">Price Breakdown</p>
      <div className="space-y-1 text-slate-600">
        <div className="flex justify-between">
          <span>Animal subtotal</span>
          <span>${pricing.animalSubtotal.toFixed(2)}</span>
        </div>
        {skinOption === 'BURNT' && (
          <div className="flex justify-between">
            <span>Skin burnt fee</span>
            <span>${pricing.slaughterFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>${pricing.deliveryCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1.5">
          <span>Total</span>
          <span>${pricing.totalPrice.toFixed(2)}</span>
        </div>
        {shares > 1 && (
          <div className="flex justify-between text-green-700 font-bold text-base pt-1">
            <span>Your share ({shares} people)</span>
            <span>${pricing.perShareAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
