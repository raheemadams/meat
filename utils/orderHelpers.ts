import { ORDER_PIPELINE } from '../constants';
import { OrderStatus, PaymentMethod } from '../types';

export function generateOrderId(): string {
  return `ORD-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function generateToken(): string {
  return crypto.randomUUID();
}

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_PIPELINE.indexOf(current);
  if (idx === -1 || idx >= ORDER_PIPELINE.length - 1) return null;
  return ORDER_PIPELINE[idx + 1];
}

export function determineInitialStatus(
  paymentMethod: PaymentMethod,
  shares: number
): OrderStatus {
  // Card orders start as Pending Payment and are only confirmed server-side once
  // the charge succeeds (see create-payment-intent `confirm` action).
  if (paymentMethod === 'CARD') return OrderStatus.PENDING_PAYMENT;
  if (paymentMethod === 'ZELLE') return OrderStatus.PENDING_VERIFICATION;
  if (shares > 1) return OrderStatus.AWAITING_PAYMENTS;
  return OrderStatus.CONFIRMED;
}

/**
 * Available delivery dates as YYYY-MM-DD strings, with a 2-day lead time.
 * Orders placed before the 6 PM cutoff can be delivered on day+2 (e.g. order
 * Monday before 6 PM → earliest Wednesday). Orders placed at/after 6 PM count
 * as the next day, pushing the earliest delivery to day+3.
 */
export function getAvailableDates(): string[] {
  const CUTOFF_HOUR = 18; // 6 PM
  const LEAD_DAYS = 2;
  const now = new Date();
  const start = now.getHours() >= CUTOFF_HOUR ? LEAD_DAYS + 1 : LEAD_DAYS;
  const dates: string[] = [];
  for (let i = start; i < start + 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
