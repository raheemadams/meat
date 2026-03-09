export type AnimalType = 'Goat' | 'Cow' | 'Chicken';

export type SkinOption = 'BURNT' | 'NOT_BURNT';

export type PaymentMethod = 'CARD' | 'ZELLE';

export enum OrderStatus {
  AWAITING_PAYMENTS    = 'Awaiting Split Payments',
  PENDING_VERIFICATION = 'Pending Verification',
  CONFIRMED            = 'Confirmed',
  SLAUGHTER_SCHEDULED  = 'Slaughter Scheduled',
  SLAUGHTERED          = 'Slaughtered',
  PROCESSED            = 'Processed',
  PACKAGED             = 'Packaged',
  OUT_FOR_DELIVERY     = 'Out for Delivery',
  DELIVERED            = 'Delivered',
}

export interface AnimalConfig {
  id: string;
  type: AnimalType;
  pricePerUnit: number;
  image: string;
  description: string;
  canShare: boolean;
  maxShares: number;
  minQuantity: number;
  sharingLabel?: string;
}

export interface PortionOwner {
  id: string;
  name: string;
  phone: string;
  isPaid: boolean;
  amount: number;
  isPrimary: boolean;
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  paymentLinkToken: string;
}

export interface PricingSnapshot {
  animalSubtotal: number;
  slaughterFee: number;
  deliveryCharge: number;
  totalPrice: number;
  perShareAmount: number;
}

export type SubscriptionInterval = 1 | 2 | 3; // months

export interface Order {
  id: string;
  userId: string;
  animalType: AnimalType;
  quantity: number;
  skinOption: SkinOption;
  shares: number;
  portionOwners: PortionOwner[];
  pricing: PricingSnapshot;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryWindow: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  zelleRefCode?: string;
  timestamp: number;
  adminNotes?: string;
  subscriptionInterval?: SubscriptionInterval; // undefined = one-time
}

export interface SimulatedSms {
  to: string;
  recipientName: string;
  message: string;
  paymentLink: string;
  orderId: string;
  amount: number;
  sentAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}
