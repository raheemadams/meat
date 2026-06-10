import { DELIVERY_CHARGE, SLAUGHTER_FEE, FREE_DELIVERY_COUPON } from '../constants';
import { AnimalConfig, PricingSnapshot, SkinOption } from '../types';

/** True if the code waives delivery. Mirror of the DB logic in compute_order_pricing(). */
export function isFreeDeliveryCoupon(coupon?: string): boolean {
  return (coupon ?? '').trim().toUpperCase() === FREE_DELIVERY_COUPON;
}

export function calculatePricing(
  config: AnimalConfig,
  quantity: number,
  skinOption: SkinOption,
  shares: number,
  coupon?: string
): PricingSnapshot {
  const animalSubtotal = config.pricePerUnit * quantity;

  // Slaughter/skin fee: flat per-order for Goat/Cow (whole animal), per-bird for Chicken
  const slaughterFee =
    skinOption === 'BURNT'
      ? config.type === 'Chicken'
        ? SLAUGHTER_FEE * quantity
        : SLAUGHTER_FEE
      : 0;

  const deliveryCharge = isFreeDeliveryCoupon(coupon) ? 0 : DELIVERY_CHARGE;
  const totalPrice = animalSubtotal + slaughterFee + deliveryCharge;
  const perShareAmount = shares > 1 ? parseFloat((totalPrice / shares).toFixed(2)) : totalPrice;

  return {
    animalSubtotal,
    slaughterFee,
    deliveryCharge,
    totalPrice,
    perShareAmount,
  };
}
