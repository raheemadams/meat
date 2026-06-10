import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Order, OrderStatus, SimulatedSms, AnimalConfig, PortionOwner } from './types';
import { buildSmsMessages } from './utils/smsSimulator';
import { getNextStatus } from './utils/orderHelpers';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomePage from './components/HomePage';
import BookingForm from './components/BookingForm';
import TrackOrder from './components/TrackOrder';
import PayMyShare from './components/PayMyShare';
import AdminDashboard from './components/AdminDashboard';
import ContactPage from './components/ContactPage';
import PolicyPage from './components/PolicyPage';
import FamilySharePage from './components/FamilySharePage';
import SmsInboxSimulator from './components/SmsInboxSimulator';

// Admin check: prefers the secure server-side app_metadata.role claim (set via
// Supabase service role / dashboard), falls back to the env-var allowlist for
// small-team convenience.  VITE_ADMIN_EMAIL is comma-separated.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const ORDER_WEBHOOK_URL: string = import.meta.env.VITE_ORDER_WEBHOOK_URL ?? '';
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';

type EmailEvent = 'order.confirmed' | 'order.out_for_delivery' | 'order.delivered';

/** Fire-and-forget email via the send-order-email Edge Function. */
async function sendOrderEmail(event: EmailEvent, user: User, order: Order) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event,
        // The order owner — the function resolves their email server-side so the
        // mail reaches the customer even when an admin triggers the status change.
        userId: order.userId,
        to: user.email, // fallback only
        customerName: user.user_metadata?.full_name ?? user.email ?? 'Customer',
        order: {
          id: order.id,
          animalType: order.animalType,
          quantity: order.quantity,
          skinOption: order.skinOption,
          shares: order.shares,
          pricing: order.pricing,
          deliveryAddress: order.deliveryAddress,
          deliveryDate: order.deliveryDate,
          deliveryWindow: order.deliveryWindow,
          paymentMethod: order.paymentMethod,
          subscriptionInterval: order.subscriptionInterval,
        },
      }),
    });
  } catch {/* fire-and-forget */}
}

// Only Confirmed and Delivered text the customer. Out-for-delivery still emails,
// just no SMS (intentionally — see notification design).
const STATUS_SMS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.CONFIRMED]:        "Your Halaliy order {id} has been confirmed! We'll let you know when it's delivered.",
  [OrderStatus.DELIVERED]:        "Your Halaliy order {id} has been delivered. Enjoy! Questions? Reply to this message.",
};

async function sendStatusSms(status: OrderStatus, phone: string, orderId: string) {
  const template = STATUS_SMS[status];
  if (!template || !phone) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type: 'status_update', to: phone, message: template.replace('{id}', orderId) }),
    });
  } catch {/* fire-and-forget */}
}

async function sendSplitPaymentSms(order: Order, appUrl: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const messages = order.portionOwners
      .filter((o) => !o.isPrimary)
      .map((o) => {
        const animalLabel = order.animalType === 'Chicken'
          ? `${order.quantity} chickens` : `1 ${order.animalType}`;
        const link = `${appUrl}/pay/${o.paymentLinkToken}`;
        return {
          to: o.phone,
          body: `Assalamu Alaikum ${o.name}! You've been added to a halal ${animalLabel} order (${order.id}). Your share: $${o.amount.toFixed(2)}. Pay here: ${link}`,
        };
      });
    if (messages.length === 0) return;
    await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type: 'split_links', messages }),
    });
  } catch {/* fire-and-forget */}
}

/** POST order details to the configured webhook when an order is confirmed.
 *  Sends application/json so Make (and other tools) auto-parse the body into
 *  fields; keepalive so the request survives page navigation (e.g. /track). */
function notifyOrderConfirmed(order: Order) {
  if (!ORDER_WEBHOOK_URL) return;
  const body = JSON.stringify({
    event: 'order.confirmed',
    orderId: order.id,
    timestamp: Date.now(),
    order: {
      id: order.id,
      animalType: order.animalType,
      quantity: order.quantity,
      skinOption: order.skinOption,
      shares: order.shares,
      pricing: order.pricing,
      deliveryAddress: order.deliveryAddress,
      deliveryDate: order.deliveryDate,
      deliveryWindow: order.deliveryWindow,
      paymentMethod: order.paymentMethod,
      portionOwners: order.portionOwners,
      status: order.status,
    },
  });
  fetch(ORDER_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {/* fire-and-forget */});
}

function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === 'admin') return true;
  return !!user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

function mapRowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    animalType: row.animal_type as Order['animalType'],
    quantity: row.quantity as number,
    skinOption: row.skin_option as Order['skinOption'],
    shares: row.shares as number,
    portionOwners: row.portion_owners as PortionOwner[],
    pricing: row.pricing as Order['pricing'],
    deliveryAddress: row.delivery_address as string,
    deliveryDate: row.delivery_date as string,
    deliveryWindow: row.delivery_window as string,
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as Order['paymentMethod'],
    zelleRefCode: row.zelle_ref_code as string | undefined,
    adminNotes: row.admin_notes as string | undefined,
    timestamp: row.timestamp as number,
    subscriptionInterval: row.subscription_interval as Order['subscriptionInterval'],
    bagSize: row.bag_size as string | undefined,
  };
}

function mapOrderToRow(order: Order) {
  return {
    id: order.id,
    user_id: order.userId,
    animal_type: order.animalType,
    quantity: order.quantity,
    skin_option: order.skinOption,
    shares: order.shares,
    portion_owners: order.portionOwners,
    pricing: order.pricing,
    delivery_address: order.deliveryAddress,
    delivery_date: order.deliveryDate,
    delivery_window: order.deliveryWindow,
    status: order.status,
    payment_method: order.paymentMethod,
    zelle_ref_code: order.zelleRefCode ?? null,
    admin_notes: order.adminNotes ?? null,
    timestamp: order.timestamp,
    subscription_interval: order.subscriptionInterval ?? null,
    bag_size: order.bagSize ?? null,
  };
}

// Toast system
interface ToastItem { id: string; message: string; type: 'success' | 'info' | 'error'; }

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white animate-fadeIn pointer-events-auto ${
            t.type === 'success' ? 'bg-green-700' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'
          }`}
          onClick={() => onRemove(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function AppInner() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [smsLog, setSmsLog] = useState<SimulatedSms[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalConfig | null>(null);
  const [pendingAnimal, setPendingAnimal] = useState<AnimalConfig | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const isAdmin = isAdminUser(user);
  // Track rapid TOKEN_REFRESHED events to detect the 429 refresh-storm scenario.
  const refreshCount = useRef(0);
  const refreshStormTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function addToast(message: string, type: ToastItem['type'] = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // onAuthStateChange fires INITIAL_SESSION on mount — no separate getSession() needed.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {

      if (event === 'TOKEN_REFRESHED') {
        // Count rapid refresh events. If too many fire in a short window it means
        // a 429 refresh-storm is about to sign the user out. We reset the counter
        // 10 s after the last refresh so normal background refreshes don't accumulate.
        refreshCount.current += 1;
        if (refreshStormTimer.current) clearTimeout(refreshStormTimer.current);
        refreshStormTimer.current = setTimeout(() => { refreshCount.current = 0; }, 10_000);
      }

      if (event === 'SIGNED_OUT') {
        // If we had many rapid refreshes just before sign-out it was rate-limited,
        // not an intentional logout — show a helpful message instead of silently failing.
        if (refreshCount.current >= 5) {
          addToast('Auth rate limit hit. Please wait a moment then sign in again.', 'error');
        }
        refreshCount.current = 0;
        setUser(null);
        setAuthReady(true);
        return;
      }

      // Update user when identity or metadata changes. Skip TOKEN_REFRESHED with
      // identical metadata — that event fires repeatedly and caused a fetchOrders loop.
      setUser((prev) => {
        const next = session?.user ?? null;
        if (prev?.id !== next?.id) return next;
        if (event === 'USER_UPDATED') return next; // always apply profile edits
        return prev; // same user, ignore TOKEN_REFRESHED noise
      });
      setAuthReady(true);

      if (session?.user) {
        // If the user signed in while trying to order an animal, open the booking form.
        setPendingAnimal((pending) => {
          if (pending) setSelectedAnimal(pending);
          return null;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch orders whenever the user changes (login / logout).
  useEffect(() => {
    if (!user) { setOrders([]); return; }
    fetchOrders();
  }, [user]);

  // Real-time order updates — RLS ensures users only receive their own rows,
  // admins receive all rows.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
    if (!error && data) {
      setOrders(data.map(mapRowToOrder));
    }
  }

  // Insert a card order in the "Pending Payment" state (price set server-side by
  // the trigger). The charge + confirmation happen next via finalizeCardOrder.
  const placeCardOrder = useCallback(async (order: Order): Promise<boolean> => {
    const { error } = await supabase.from('orders').insert(mapOrderToRow(order));
    if (error) {
      addToast('Failed to start your order. Please try again.', 'error');
      return false;
    }
    setOrders((prev) => [order, ...prev]);
    return true;
  }, []);

  // After the card charge succeeds, the confirm action verifies it server-side and
  // flips the order to Confirmed / Awaiting Split Payments. Then we notify + route.
  const finalizeCardOrder = useCallback(async (orderId: string, paymentIntentId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ action: 'confirm', orderId, paymentIntentId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok || !j.order) {
        addToast('Payment confirmation failed. Please contact support.', 'error');
        return false;
      }
      const confirmed = mapRowToOrder(j.order);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? confirmed : o)));

      if (confirmed.status === OrderStatus.CONFIRMED) {
        notifyOrderConfirmed(confirmed);
        if (user) sendOrderEmail('order.confirmed', user, confirmed);
        const primaryPhone = confirmed.portionOwners.find((o) => o.isPrimary)?.phone ?? '';
        sendStatusSms(OrderStatus.CONFIRMED, primaryPhone, orderId);
      }
      if (confirmed.shares > 1) {
        const msgs = buildSmsMessages(confirmed);
        setSmsLog((prev) => [...msgs, ...prev]);
        sendSplitPaymentSms(confirmed, window.location.origin);
      }

      addToast(confirmed.shares > 1 ? 'Payment received! Co-buyers have been notified.' : 'Order confirmed — thank you!');
      setSelectedAnimal(null);
      navigate('/track');
      return true;
    } catch {
      addToast('Payment confirmation failed. Please contact support.', 'error');
      return false;
    }
  }, [navigate, user]);

  // Zelle orders need no card charge — placed straight into Pending Verification.
  const submitZelleOrder = useCallback(async (order: Order): Promise<boolean> => {
    const { error } = await supabase.from('orders').insert(mapOrderToRow(order));
    if (error) {
      addToast('Failed to place order. Please try again.', 'error');
      return false;
    }
    setOrders((prev) => [order, ...prev]);

    if (order.shares > 1) {
      const msgs = buildSmsMessages(order);
      setSmsLog((prev) => [...msgs, ...prev]);
      sendSplitPaymentSms(order, window.location.origin);
      addToast(`Order placed! SMS sent to ${msgs.length} member${msgs.length > 1 ? 's' : ''}.`);
    } else {
      addToast("Order placed! Complete your Zelle transfer — we'll verify it shortly.");
    }

    setSelectedAnimal(null);
    navigate('/track');
    return true;
  }, [navigate]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    await supabase.from('orders').update({ status }).eq('id', orderId);
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const updated = { ...order, status };
      const primaryPhone = updated.portionOwners.find((o) => o.isPrimary)?.phone ?? '';
      if (status === OrderStatus.CONFIRMED) {
        notifyOrderConfirmed(updated);
        if (user) sendOrderEmail('order.confirmed', user, updated);
        sendStatusSms(OrderStatus.CONFIRMED, primaryPhone, orderId);
      } else if (status === OrderStatus.OUT_FOR_DELIVERY) {
        if (user) sendOrderEmail('order.out_for_delivery', user, updated);
      } else if (status === OrderStatus.DELIVERED) {
        if (user) sendOrderEmail('order.delivered', user, updated);
        sendStatusSms(OrderStatus.DELIVERED, primaryPhone, orderId);
      }
    }
  }, [orders, user]);

  const advanceOrderStatus = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next = getNextStatus(order.status);
    if (next) await updateOrderStatus(orderId, next);
  }, [orders, updateOrderStatus]);

  const verifyZellePayment = useCallback(async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOwners = order.portionOwners.map((o) =>
      o.isPrimary ? { ...o, isPaid: true } : o
    );
    const newStatus = order.shares > 1 ? OrderStatus.AWAITING_PAYMENTS : OrderStatus.CONFIRMED;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, portionOwners: updatedOwners, status: newStatus } : o
      )
    );
    await supabase
      .from('orders')
      .update({ portion_owners: updatedOwners, status: newStatus })
      .eq('id', orderId);
    if (newStatus === OrderStatus.CONFIRMED) {
      const confirmed = { ...order, portionOwners: updatedOwners, status: newStatus };
      notifyOrderConfirmed(confirmed);
      if (user) sendOrderEmail('order.confirmed', user, confirmed);
      const primaryPhone = updatedOwners.find((o) => o.isPrimary)?.phone ?? '';
      sendStatusSms(OrderStatus.CONFIRMED, primaryPhone, orderId);
    }
    addToast('Zelle payment verified!');
  }, [orders, user]);

  // Admin marks a single co-buyer's share as paid (e.g. they paid by Zelle/offline).
  const markOwnerPaid = useCallback(async (orderId: string, ownerId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOwners = order.portionOwners.map((o) =>
      o.id === ownerId ? { ...o, isPaid: true } : o
    );
    const allPaid = updatedOwners.every((o) => o.isPaid);
    const newStatus = allPaid ? OrderStatus.CONFIRMED : order.status;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, portionOwners: updatedOwners, status: newStatus } : o
      )
    );
    await supabase
      .from('orders')
      .update({ portion_owners: updatedOwners, status: newStatus })
      .eq('id', orderId);
    if (newStatus === OrderStatus.CONFIRMED) {
      const confirmed = { ...order, portionOwners: updatedOwners, status: newStatus };
      notifyOrderConfirmed(confirmed);
      if (user) sendOrderEmail('order.confirmed', user, confirmed);
      const primaryPhone = updatedOwners.find((o) => o.isPrimary)?.phone ?? '';
      sendStatusSms(OrderStatus.CONFIRMED, primaryPhone, orderId);
    }
    addToast('Share marked as paid.');
  }, [orders, user]);

  const updateAdminNotes = useCallback(async (orderId: string, adminNotes: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, adminNotes } : o))
    );
    await supabase.from('orders').update({ admin_notes: adminNotes }).eq('id', orderId);
  }, []);

  // Cancel an order: the cancel-order edge function refunds card charges, marks it
  // Cancelled, and notifies the customer (email + SMS). We optimistically flip the
  // status and revert if the call fails.
  const cancelOrder = useCallback(async (orderId: string, reason: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o))
    );
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ orderId, reason }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o)));
        addToast(j.error === 'already_cancelled' ? 'Order is already cancelled.' : 'Cancel failed — try again.', 'error');
        return;
      }
      const refundMsg = j.refunded > 0 ? ` Refunded $${Number(j.amount).toFixed(2)} to ${j.refunded} payment${j.refunded > 1 ? 's' : ''}.` : '';
      addToast(`Order cancelled.${refundMsg}`);
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o)));
      addToast('Cancel failed — try again.', 'error');
    }
  }, [orders]);

  // Regular users see only their own orders in the track view.
  // Admins see all orders in AdminDashboard (via RLS policy that grants admin full access).
  const userOrders = orders.filter((o) => o.userId === user?.id);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <i className="fa-solid fa-spinner fa-spin text-green-700 text-2xl"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        isAdmin={isAdmin}
        orderCount={userOrders.length}
        onAuthClick={() => setShowAuth(true)}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                onSelectAnimal={(config) => {
                  if (!user) { setPendingAnimal(config); setShowAuth(true); return; }
                  setSelectedAnimal(config);
                }}
                isLoggedIn={!!user}
              />
            }
          />

          <Route
            path="/track"
            element={
              user ? (
                <TrackOrder
                  orders={userOrders}
                  addToast={addToast}
                />
              ) : (
                <div className="flex items-center justify-center min-h-64">
                  <div className="text-center">
                    <i className="fa-solid fa-lock text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500 mb-4">Sign in to view your orders</p>
                    <button
                      onClick={() => setShowAuth(true)}
                      className="bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )
            }
          />

          <Route path="/pay/:token" element={<PayMyShare />} />

          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminDashboard
                  orders={orders}
                  onUpdateStatus={updateOrderStatus}
                  onAdvanceStatus={advanceOrderStatus}
                  onVerifyZelle={verifyZellePayment}
                  onUpdateNotes={updateAdminNotes}
                  onMarkOwnerPaid={markOwnerPaid}
                  onCancelOrder={cancelOrder}
                />
              ) : (
                <div className="flex items-center justify-center min-h-64">
                  <div className="text-center">
                    <i className="fa-solid fa-shield-halved text-4xl text-slate-300 mb-3"></i>
                    <p className="text-slate-500">
                      {user ? 'Admin access required.' : 'Sign in to continue.'}
                    </p>
                    {!user && (
                      <button
                        onClick={() => setShowAuth(true)}
                        className="mt-4 bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              )
            }
          />

          <Route path="/contact" element={<ContactPage />} />
          <Route path="/policies" element={<PolicyPage />} />
          <Route path="/cowshare" element={<FamilySharePage />} />
          <Route path="/goatshare" element={<FamilySharePage />} />
          <Route path="/family-share" element={<FamilySharePage />} />
        </Routes>
      </main>

      {selectedAnimal && user && (
        <BookingForm
          config={selectedAnimal}
          user={user}
          onClose={() => setSelectedAnimal(null)}
          onPlaceCardOrder={placeCardOrder}
          onFinalizeCardOrder={finalizeCardOrder}
          onSubmitZelleOrder={submitZelleOrder}
          defaultAddress={user.user_metadata?.address ?? ''}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSignedUp={(name) => addToast(`Welcome to Halaliy, ${name.split(' ')[0]}! 🎉 Check your inbox.`)}
        />
      )}

      <SmsInboxSimulator messages={smsLog} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <footer className="bg-slate-950 text-slate-400 mt-auto">
        {/* Green accent strip to separate the footer from the section above */}
        <div className="h-1 bg-gradient-to-r from-green-600 via-green-500 to-green-600"></div>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-5">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/icon-192.png" alt="Halaliy" className="w-9 h-9 rounded-lg" />
                <span className="font-display font-black text-xl text-white">Halaliy</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Fresh, halal meat from local Houston farms. Order a whole goat, sheep, or cow,
                split the cost with family and friends, and have it delivered fresh to your door.
              </p>
            </div>

            {/* Explore */}
            <div className="md:col-span-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Explore</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/" className="hover:text-green-400 transition-colors">Browse Animals</Link></li>
                <li><Link to="/track" className="hover:text-green-400 transition-colors">My Orders</Link></li>
                <li><Link to="/policies" className="hover:text-green-400 transition-colors">Policies &amp; FAQs</Link></li>
                <li><Link to="/contact" className="hover:text-green-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Get in touch */}
            <div className="md:col-span-4">
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Get in Touch</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="mailto:info@halaliy.com" className="flex items-center gap-2.5 hover:text-green-400 transition-colors">
                    <i className="fa-solid fa-envelope text-green-500 w-4"></i> info@halaliy.com
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <i className="fa-solid fa-location-dot text-green-500 w-4"></i> Greater Houston, TX
                </li>
                <li className="flex items-center gap-2.5">
                  <i className="fa-solid fa-clock text-green-500 w-4"></i> Mon–Sat: 8AM–6PM · Sun: 9AM–4PM
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-5">
                {['Halal Certified', 'Ethically Raised', 'Locally Sourced'].map((t) => (
                  <span key={t} className="text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 rounded-full px-3 py-1">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Halaliy. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link to="/policies" className="hover:text-green-400 transition-colors">Policies</Link>
              <Link to="/contact" className="hover:text-green-400 transition-colors">Contact</Link>
              <a href="mailto:info@halaliy.com" className="hover:text-green-400 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
