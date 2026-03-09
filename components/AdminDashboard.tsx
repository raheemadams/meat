import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Order, OrderStatus } from '../types';
import { ORDER_PIPELINE, STATUS_BADGE_COLORS } from '../constants';
import { getNextStatus, formatDate } from '../utils/orderHelpers';

interface Props {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onAdvanceStatus: (orderId: string) => void;
  onVerifyZelle: (orderId: string) => void;
  onUpdateNotes: (orderId: string, notes: string) => void;
}

const CHART_COLORS: Record<string, string> = {
  Goat: '#16a34a',
  Cow: '#b45309',
  Chicken: '#d97706',
};

export default function AdminDashboard({
  orders,
  onUpdateStatus,
  onAdvanceStatus,
  onVerifyZelle,
  onUpdateNotes,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'active' | 'zelle' | 'split'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const activeOrders = orders.filter((o) => o.status !== OrderStatus.DELIVERED);
  const zelleOrders = orders.filter((o) => o.status === OrderStatus.PENDING_VERIFICATION);
  const splitOrders = orders.filter((o) => o.status === OrderStatus.AWAITING_PAYMENTS);
  const totalRevenue = orders.reduce((sum, o) => sum + o.pricing.totalPrice, 0);

  const chartData = ['Goat', 'Cow', 'Chicken'].map((type) => ({
    name: type,
    quantity: orders
      .filter((o) => o.animalType === type)
      .reduce((sum, o) => sum + o.quantity, 0),
  }));

  const filtered = orders.filter((o) => {
    if (filter === 'active') return o.status !== OrderStatus.DELIVERED;
    if (filter === 'zelle') return o.status === OrderStatus.PENDING_VERIFICATION;
    if (filter === 'split') return o.status === OrderStatus.AWAITING_PAYMENTS;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-shield-halved text-white"></i>
        </div>
        <div>
          <h1 className="font-display font-black text-2xl text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm">{orders.length} total orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Orders" value={activeOrders.length} icon="fa-box-open" color="text-green-700" />
        <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon="fa-dollar-sign" color="text-slate-700" />
        <StatCard label="Zelle Pending" value={zelleOrders.length} icon="fa-mobile-screen" color="text-purple-700" />
        <StatCard label="Awaiting Splits" value={splitOrders.length} icon="fa-users" color="text-amber-700" />
      </div>

      {/* Needs Attention */}
      {(zelleOrders.length > 0 || splitOrders.length > 0) && (
        <div className="mb-6 space-y-3">
          {zelleOrders.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-magnifying-glass-dollar text-purple-600"></i>
                <h3 className="font-semibold text-purple-800 text-sm">
                  {zelleOrders.length} Zelle Payment{zelleOrders.length > 1 ? 's' : ''} to Verify
                </h3>
              </div>
              <div className="space-y-2">
                {zelleOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100">
                    <div className="text-sm">
                      <span className="font-mono font-semibold text-slate-800">{o.id}</span>
                      <span className="text-slate-500 ml-2">· {o.animalType} · ${o.pricing.perShareAmount.toFixed(2)}</span>
                      <span className="ml-2 font-mono text-purple-700 text-xs">{o.zelleRefCode}</span>
                    </div>
                    <button
                      onClick={() => onVerifyZelle(o.id)}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Verify Zelle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {splitOrders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <i className="fa-solid fa-hourglass-half text-amber-600"></i>
                <h3 className="font-semibold text-amber-800 text-sm">
                  {splitOrders.length} Order{splitOrders.length > 1 ? 's' : ''} Awaiting Split Payments
                </h3>
              </div>
              <p className="text-xs text-amber-600">These will auto-confirm once all members pay.</p>
            </div>
          )}
        </div>
      )}

      {/* Chart + Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-4">Animals Ordered</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={40}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="quantity" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={CHART_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Filter Orders</h3>
          <div className="space-y-2">
            {([
              ['all', 'All Orders', orders.length],
              ['active', 'Active', activeOrders.length],
              ['zelle', 'Zelle Pending', zelleOrders.length],
              ['split', 'Awaiting Splits', splitOrders.length],
            ] as const).map(([val, label, count]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                  filter === val ? 'bg-green-50 text-green-800 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
                <span className="bg-slate-100 text-slate-600 text-xs rounded-full px-2 py-0.5">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Order Log</h3>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-slate-400 text-sm">No orders match this filter.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                expanded={expandedOrder === order.id}
                onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                onUpdateStatus={onUpdateStatus}
                onAdvanceStatus={onAdvanceStatus}
                onVerifyZelle={onVerifyZelle}
                onUpdateNotes={onUpdateNotes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-4">
      <div className="flex items-center gap-2 mb-2">
        <i className={`fa-solid ${icon} ${color} text-sm`}></i>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <p className={`font-display font-black text-2xl ${color}`}>{value}</p>
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onUpdateStatus,
  onAdvanceStatus,
  onVerifyZelle,
  onUpdateNotes,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, s: OrderStatus) => void;
  onAdvanceStatus: (id: string) => void;
  onVerifyZelle: (id: string) => void;
  onUpdateNotes: (id: string, n: string) => void;
}) {
  const next = getNextStatus(order.status);
  const paidCount = order.portionOwners.filter((o) => o.isPaid).length;

  return (
    <div>
      <div
        className="px-5 py-4 flex items-center gap-3 flex-wrap cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-slate-800">{order.id}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_COLORS[order.status]}`}>
              {order.status}
            </span>
            {order.paymentMethod === 'ZELLE' && (
              <span className="text-xs text-purple-600 font-mono">{order.zelleRefCode}</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {order.quantity}× {order.animalType} · {order.skinOption === 'BURNT' ? 'Skin Burnt' : 'Skin Not Burnt'} ·{' '}
            {order.shares > 1 ? `${paidCount}/${order.shares} paid` : order.paymentMethod} ·{' '}
            {formatDate(order.deliveryDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-green-700">${order.pricing.totalPrice.toFixed(2)}</span>
          <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-slate-400 text-xs`}></i>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 px-5 py-4 space-y-4 animate-fadeIn">
          {/* Status controls */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={(e) => e.stopPropagation()}
              >
                {ORDER_PIPELINE.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {next && (
              <div className="self-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onAdvanceStatus(order.id); }}
                  className="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-forward-step mr-1"></i>
                  Next: {next}
                </button>
              </div>
            )}
            {order.status === OrderStatus.PENDING_VERIFICATION && order.paymentMethod === 'ZELLE' && (
              <div className="self-end">
                <button
                  onClick={(e) => { e.stopPropagation(); onVerifyZelle(order.id); }}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <i className="fa-solid fa-check mr-1"></i>
                  Verify Zelle
                </button>
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">Delivery Address</p>
              <p>{order.deliveryAddress}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">Window</p>
              <p>{order.deliveryWindow}</p>
            </div>
          </div>

          {/* Portion owners */}
          {order.shares > 1 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Portion Owners</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {order.portionOwners.map((o) => (
                  <div key={o.id} className={`text-xs rounded-lg p-2.5 border ${o.isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">{o.name}{o.isPrimary ? ' (Primary)' : ''}</span>
                      <span className={`font-semibold ${o.isPaid ? 'text-green-600' : 'text-slate-400'}`}>
                        {o.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-slate-400">{o.phone}</p>
                    <p className="text-green-700 font-medium">${o.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Admin Notes</label>
            <textarea
              defaultValue={order.adminNotes ?? ''}
              onBlur={(e) => onUpdateNotes(order.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add internal notes here…"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
