import { DELIVERY_CHARGE, SLAUGHTER_FEE } from '../constants';
import { AnimalConfig, PricingSnapshot, SkinOption } from '../types';

export function calculatePricing(
  config: AnimalConfig,
  quantity: number,
  skinOption: SkinOption,
  shares: number
): PricingSnapshot {
  const animalSubtotal = config.pricePerUnit * quantity;

  // Slaughter/skin fee: flat per-order for Goat/Cow (whole animal), per-bird for Chicken
  const slaughterFee =
    skinOption === 'BURNT'
      ? config.type === 'Chicken'
        ? SLAUGHTER_FEE * quantity
        : SLAUGHTER_FEE
      : 0;

  const totalPrice = animalSubtotal + slaughterFee + DELIVERY_CHARGE;
  const perShareAmount = shares > 1 ? parseFloat((totalPrice / shares).toFixed(2)) : totalPrice;

  return {
    animalSubtotal,
    slaughterFee,
    deliveryCharge: DELIVERY_CHARGE,
    totalPrice,
    perShareAmount,
  };
}
