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
  if (paymentMethod === 'ZELLE') return OrderStatus.PENDING_VERIFICATION;
  if (shares > 1) return OrderStatus.AWAITING_PAYMENTS;
  return OrderStatus.CONFIRMED;
}

/** Returns the next 7 calendar dates as YYYY-MM-DD strings */
export function getAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
