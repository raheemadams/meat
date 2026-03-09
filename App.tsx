import { useEffect, useRef, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import SmsInboxSimulator from './components/SmsInboxSimulator';

// Admin check: prefers the secure server-side app_metadata.role claim (set via
// Supabase service role / dashboard), falls back to the env-var allowlist for
// small-team convenience.  VITE_ADMIN_EMAIL is comma-separated.
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAIL ?? '')
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

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
      console.log('[auth]', event, session?.user?.email ?? null);

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

      // Only update user when the identity actually changes — TOKEN_REFRESHED
      // fires the same user repeatedly and would otherwise re-trigger the
      // fetchOrders effect, creating a refresh → fetchOrders → refresh loop.
      setUser((prev) => {
        const next = session?.user ?? null;
        if (prev?.id === next?.id) return prev;
        return next;
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

  const handleCreateOrder = useCallback(async (order: Order) => {
    const row = mapOrderToRow(order);
    const { error } = await supabase.from('orders').insert(row);
    if (error) {
      setOrders((prev) => [order, ...prev]);
    } else {
      setOrders((prev) => [order, ...prev]);
    }

    if (order.shares > 1) {
      const msgs = buildSmsMessages(order);
      setSmsLog((prev) => [...msgs, ...prev]);
      addToast(`Order placed! Simulated SMS sent to ${msgs.length} member${msgs.length > 1 ? 's' : ''}.`);
    } else {
      addToast('Order placed successfully!');
    }

    setSelectedAnimal(null);
    navigate('/track');
  }, [navigate]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    await supabase.from('orders').update({ status }).eq('id', orderId);
  }, []);

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
    addToast('Zelle payment verified!');
  }, [orders]);

  const updatePortionPaid = useCallback(async (orderId: string, paymentLinkToken: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const updatedOwners = order.portionOwners.map((o) =>
      o.paymentLinkToken === paymentLinkToken ? { ...o, isPaid: true } : o
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
  }, [orders]);

  const updateAdminNotes = useCallback(async (orderId: string, adminNotes: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, adminNotes } : o))
    );
    await supabase.from('orders').update({ admin_notes: adminNotes }).eq('id', orderId);
  }, []);

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
                  onSimulatePortionPaid={updatePortionPaid}
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

          <Route
            path="/pay/:token"
            element={
              <PayMyShare
                orders={orders}
                onPaymentComplete={updatePortionPaid}
                addToast={addToast}
              />
            }
          />

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
        </Routes>
      </main>

      {selectedAnimal && user && (
        <BookingForm
          config={selectedAnimal}
          user={user}
          onClose={() => setSelectedAnimal(null)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <SmsInboxSimulator messages={smsLog} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-sm mt-auto">
        <p>© {new Date().getFullYear()} Halal Meat Co. — Houston, TX</p>
        <p className="mt-1 text-slate-500 text-xs">
          Ethically raised · Halal certified · Community sharing
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  );
}
