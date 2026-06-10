import { AnimalConfig, OrderStatus } from './types';

export const DELIVERY_CHARGE = 35;
export const SLAUGHTER_FEE = 20;

export const APP_EMAIL = 'orders@halaliy.com';      // transactional / Zelle / order notifications
export const CONTACT_EMAIL = 'info@halaliy.com';    // public-facing contact / general inquiries
export const BUSINESS_NAME = 'Halaliy';

export const ZELLE_INFO = {
  email: APP_EMAIL,
  phone: '281-704-6043',
  businessName: BUSINESS_NAME,
};

export const ANIMAL_CONFIGS: AnimalConfig[] = [
  {
    id: 'goat',
    type: 'Goat',
    pricePerUnit: 479,
    image: '/images/goat.png',
    description: 'Whole halal goat, fresh and ready. Split with up to 4 families.',
    canShare: true,
    maxShares: 4,
    minQuantity: 1,
    sharingLabel: 'Share with up to 4 people',
  },
  {
    id: 'cow',
    type: 'Cow',
    pricePerUnit: 1800,
    image: '/images/cow.png',
    description: 'Whole halal cow, fresh and ready. Split with up to 7 families.',
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
    description: 'Fresh halal chicken, delivered to your door. Minimum 5 birds.',
    canShare: false,
    maxShares: 1,
    minQuantity: 5,
  },
  {
    id: 'goat-meat',
    type: 'Goat Meat',
    pricePerUnit: 24,
    image: '/images/goat-meat.png',
    description: 'Fresh halal goat meat, cut and ready to cook.',
    canShare: false,
    maxShares: 1,
    minQuantity: 1,
    isBagged: true,
    variants: [
      { weightLabel: '2 lb',  price: 24  },
      { weightLabel: '5 lb',  price: 60  },
      { weightLabel: '10 lb', price: 120 },
    ],
  },
  {
    id: 'cow-skin',
    type: 'Cow Skin',
    pricePerUnit: 24,
    image: '/images/cow-skin.png',
    description: 'Clean halal cow skin (ponmo), ready to cook.',
    canShare: false,
    maxShares: 1,
    minQuantity: 1,
    isBagged: true,
    variants: [
      { weightLabel: '2 lb', price: 24 },
      { weightLabel: '5 lb', price: 60 },
    ],
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
  [OrderStatus.PENDING_PAYMENT]:      'bg-slate-100 text-slate-600',
  [OrderStatus.AWAITING_PAYMENTS]:    'bg-amber-100 text-amber-800',
  [OrderStatus.PENDING_VERIFICATION]: 'bg-purple-100 text-purple-800',
  [OrderStatus.CONFIRMED]:            'bg-green-100 text-green-800',
  [OrderStatus.SLAUGHTER_SCHEDULED]:  'bg-blue-100 text-blue-800',
  [OrderStatus.SLAUGHTERED]:          'bg-red-100 text-red-900',
  [OrderStatus.PROCESSED]:            'bg-teal-100 text-teal-800',
  [OrderStatus.PACKAGED]:             'bg-indigo-100 text-indigo-800',
  [OrderStatus.OUT_FOR_DELIVERY]:     'bg-orange-100 text-orange-800',
  [OrderStatus.DELIVERED]:            'bg-emerald-100 text-emerald-900',
  [OrderStatus.CANCELLED]:            'bg-red-100 text-red-700',
};
