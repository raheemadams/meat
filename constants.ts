import { AnimalConfig, OrderStatus } from './types';

export const DELIVERY_CHARGE = 35;
export const SLAUGHTER_FEE = 30;

export const APP_EMAIL = 'orders@halalmeats.com';
export const BUSINESS_NAME = 'Halal Meat Co.';

export const ZELLE_INFO = {
  email: APP_EMAIL,
  phone: '713-555-0100',
  businessName: BUSINESS_NAME,
};

export const ANIMAL_CONFIGS: AnimalConfig[] = [
  {
    id: 'goat',
    type: 'Goat',
    pricePerUnit: 275,
    image: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=800',
    description:
      'Whole Boer or Spanish goat, ethically raised and halal certified. Perfect for Eid al-Adha or any gathering. Split the cost between up to 4 families.',
    canShare: true,
    maxShares: 4,
    minQuantity: 1,
    sharingLabel: 'Share with up to 4 people',
  },
  {
    id: 'cow',
    type: 'Cow',
    pricePerUnit: 1800,
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&q=80&w=800',
    description:
      'Full Texas Angus or Hereford, locally ranch-raised. Premium halal-certified beef. Share between up to 7 families to make it affordable.',
    canShare: true,
    maxShares: 7,
    minQuantity: 1,
    sharingLabel: 'Share with up to 7 people',
  },
  {
    id: 'chicken',
    type: 'Chicken',
    pricePerUnit: 15,
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&q=80&w=800',
    description:
      'Pasture-raised, halal-slaughtered chickens. Order as many birds as you need — minimum 5 per order. Delivered fresh to your door.',
    canShare: false,
    maxShares: 1,
    minQuantity: 5,
  },
];

export const ORDER_PIPELINE: OrderStatus[] = [
  OrderStatus.AWAITING_PAYMENTS,
  OrderStatus.PENDING_VERIFICATION,
  OrderStatus.CONFIRMED,
  OrderStatus.SLAUGHTER_SCHEDULED,
  OrderStatus.SLAUGHTERED,
  OrderStatus.PROCESSED,
  OrderStatus.PACKAGED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

export const DELIVERY_WINDOWS = [
  'Early Morning (7:00 AM – 10:00 AM)',
  'Late Morning (10:00 AM – 1:00 PM)',
  'Afternoon (1:00 PM – 4:00 PM)',
  'Evening (4:00 PM – 7:00 PM)',
];

export const BENEFITS = [
  {
    icon: 'fa-leaf',
    title: 'Ethically Raised',
    desc: 'No hormones, no antibiotics. All animals are pasture-fed and humanely handled.',
  },
  {
    icon: 'fa-truck-fast',
    title: 'Local Houston Delivery',
    desc: 'Direct from our ranch partners to your door. Fresh, never frozen.',
  },
  {
    icon: 'fa-users',
    title: 'Community Sharing',
    desc: 'Split a whole goat or cow with friends. Each person pays only their share.',
  },
  {
    icon: 'fa-certificate',
    title: '100% Halal Certified',
    desc: 'Every animal slaughtered by certified Muslim butchers following Islamic guidelines.',
  },
];

export const STATUS_BADGE_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.AWAITING_PAYMENTS]:    'bg-amber-100 text-amber-800',
  [OrderStatus.PENDING_VERIFICATION]: 'bg-purple-100 text-purple-800',
  [OrderStatus.CONFIRMED]:            'bg-green-100 text-green-800',
  [OrderStatus.SLAUGHTER_SCHEDULED]:  'bg-blue-100 text-blue-800',
  [OrderStatus.SLAUGHTERED]:          'bg-red-100 text-red-900',
  [OrderStatus.PROCESSED]:            'bg-teal-100 text-teal-800',
  [OrderStatus.PACKAGED]:             'bg-indigo-100 text-indigo-800',
  [OrderStatus.OUT_FOR_DELIVERY]:     'bg-orange-100 text-orange-800',
  [OrderStatus.DELIVERED]:            'bg-emerald-100 text-emerald-900',
};
