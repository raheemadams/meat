import { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { ORDER_PIPELINE, STATUS_BADGE_COLORS } from '../constants';
import { formatDate } from '../utils/orderHelpers';

interface Props {
  orders: Order[];
  onSimulatePortionPaid: (orderId: string, paymentLinkToken: string) => void;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Stages shown in customer timeline (skip admin-only initial stages when not relevant)
function getTimelineStages(order: Order): OrderStatus[] {
  const all = ORDER_PIPELINE;
  // Always include from CONFIRMED onwards
  const confirmedIdx = all.indexOf(OrderStatus.CONFIRMED);
  const stages: OrderStatus[] = [];

  if (order.paymentMethod === 'ZELLE') stages.push(OrderStatus.PENDING_VERIFICATION);
  if (order.shares > 1) stages.push(OrderStatus.AWAITING_PAYMENTS);
  stages.push(...all.slice(confirmedIdx));

  // Remove duplicates while preserving order
  return stages.filter((s, i, arr) => arr.indexOf(s) === i);
}

function statusIcon(status: OrderStatus): string {
  const map: Partial<Record<OrderStatus, string>> = {
    [OrderStatus.AWAITING_PAYMENTS]:    'fa-hourglass-half',
    [OrderStatus.PENDING_VERIFICATION]: 'fa-magnifying-glass-dollar',
    [OrderStatus.CONFIRMED]:            'fa-circle-check',
    [OrderStatus.SLAUGHTER_SCHEDULED]:  'fa-calendar-check',
    [OrderStatus.SLAUGHTERED]:          'fa-check-double',
    [OrderStatus.PROCESSED]:            'fa-scissors',
    [OrderStatus.PACKAGED]:             'fa-box',
    [OrderStatus.OUT_FOR_DELIVERY]:     'fa-truck-fast',
    [OrderStatus.DELIVERED]:            'fa-house-chimney-crack',
  };
  return map[status] ?? 'fa-circle';
}

export default function TrackOrder({ orders, onSimulatePortionPaid, addToast }: Props) {
  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <i className="fa-solid fa-box-open text-3xl text-slate-300"></i>
        </div>
        <h2 className="font-display font-black text-2xl text-slate-700 mb-2">No orders yet</h2>
        <p className="text-slate-400 mb-6">Browse our animals and place your first order to get started.</p>
        <a href="/" className="inline-block bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-600 transition-colors">
          Browse Animals
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      <div>
        <h1 className="font-display font-black text-2xl text-slate-800 mb-1">My Orders</h1>
        <p className="text-slate-500 text-sm">{orders.length} order{orders.length > 1 ? 's' : ''}</p>
      </div>

      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onSimulatePortionPaid={onSimulatePortionPaid}
          addToast={addToast}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  onSimulatePortionPaid,
  addToast,
}: {
  order: Order;
  onSimulatePortionPaid: (orderId: string, token: string) => void;
  addToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const [expanded, setExpanded] = useState(!isDelivered);

  const stages = getTimelineStages(order);
  const currentIdx = stages.indexOf(order.status);
  const paidCount = order.portionOwners.filter((o) => o.isPaid).length;
  const totalOwners = order.portionOwners.length;
  const awaitingPayments = order.status === OrderStatus.AWAITING_PAYMENTS;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Order header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4 flex-wrap hover:bg-slate-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-black text-slate-800 text-sm">{order.id}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE_COLORS[order.status]}`}>
              {order.status}
            </span>
            {order.subscriptionInterval && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <i className="fa-solid fa-rotate mr-1"></i>
                {order.subscriptionInterval === 1 ? 'Monthly' : `Every ${order.subscriptionInterval}mo`}
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {order.quantity} {order.animalType}{order.quantity > 1 ? 's' : ''} ·{' '}
            {order.skinOption === 'BURNT' ? 'Skin Burnt' : 'Skin Not Burnt'} ·{' '}
            {order.paymentMethod}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display font-black text-green-700 text-lg">${order.pricing.totalPrice.toFixed(2)}</p>
            <p className="text-xs text-slate-400">Placed {new Date(order.timestamp).toLocaleDateString()}</p>
          </div>
          <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {expanded && <>
      {/* Awaiting payments alert */}
      {awaitingPayments && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-2 text-sm text-amber-800">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>
            Waiting for {totalOwners - paidCount} more payment{totalOwners - paidCount > 1 ? 's' : ''}.
            Order will confirm once all shares are paid.
          </span>
        </div>
      )}

      {/* Zelle pending alert */}
      {order.status === OrderStatus.PENDING_VERIFICATION && order.paymentMethod === 'ZELLE' && (
        <div className="bg-purple-50 border-b border-purple-200 px-5 py-3 flex items-center gap-2 text-sm text-purple-800">
          <i className="fa-solid fa-magnifying-glass-dollar"></i>
          <span>Zelle transfer pending admin verification. Ref: <strong className="font-mono">{order.zelleRefCode}</strong></span>
        </div>
      )}

      {/* Timeline */}
      <div className="px-5 py-5">
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={stage} className="flex flex-col items-center flex-shrink-0 min-w-0" style={{ minWidth: 64 }}>
                <div className="relative">
                  {i < stages.length - 1 && (
                    <div
                      className={`absolute top-4 left-full w-8 h-0.5 ${done ? 'bg-green-500' : 'bg-slate-200'}`}
                      style={{ width: 24, left: '100%', top: 14 }}
                    />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      active
                        ? 'bg-green-600 text-white ring-4 ring-green-100 scale-110'
                        : done
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <i className={`fa-solid ${statusIcon(stage)} text-xs`}></i>
                  </div>
                </div>
                <p
                  className={`text-center mt-2 text-xs leading-tight ${
                    active ? 'font-bold text-green-700' : done ? 'text-slate-500' : 'text-slate-300'
                  }`}
                  style={{ maxWidth: 60 }}
                >
                  {stage}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery info */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
        <span><i className="fa-solid fa-location-dot mr-1.5 text-slate-400"></i>{order.deliveryAddress}</span>
        <span><i className="fa-solid fa-calendar mr-1.5 text-slate-400"></i>{formatDate(order.deliveryDate)}</span>
        <span><i className="fa-solid fa-clock mr-1.5 text-slate-400"></i>{order.deliveryWindow}</span>
      </div>

      {/* Split payment members */}
      {order.shares > 1 && (
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-700 mb-3">
            Split Payment — {paidCount}/{totalOwners} paid
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.portionOwners.map((owner) => (
              <div
                key={owner.id}
                className={`rounded-xl p-3 border text-sm ${
                  owner.isPaid
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800">
                    {owner.name}{owner.isPrimary ? ' (You)' : ''}
                  </span>
                  {owner.isPaid ? (
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Paid</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
                <p className="text-slate-500 text-xs">{owner.phone}</p>
                <p className="text-green-700 font-semibold text-xs mt-1">${owner.amount.toFixed(2)}</p>

                {!owner.isPrimary && !owner.isPaid && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}${window.location.pathname}#/pay/${owner.paymentLinkToken}`;
                        navigator.clipboard.writeText(link);
                        addToast('Payment link copied!', 'info');
                      }}
                      className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      <i className="fa-solid fa-copy mr-1"></i>Copy Link
                    </button>
                    <button
                      onClick={() => {
                        onSimulatePortionPaid(order.id, owner.paymentLinkToken);
                        addToast(`${owner.name}'s payment simulated!`);
                      }}
                      className="flex-1 text-xs bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Simulate Pay
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
