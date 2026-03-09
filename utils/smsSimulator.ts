import { Order, PortionOwner, SimulatedSms } from '../types';

export function buildSmsMessages(order: Order): SimulatedSms[] {
  const baseUrl = window.location.origin + window.location.pathname;

  return order.portionOwners
    .filter((owner) => !owner.isPrimary)
    .map((owner) => ({
      to: owner.phone,
      recipientName: owner.name,
      message: buildSmsText(owner, order),
      paymentLink: `${baseUrl}#/pay/${owner.paymentLinkToken}`,
      orderId: order.id,
      amount: owner.amount,
      sentAt: Date.now(),
    }));
}

function buildSmsText(owner: PortionOwner, order: Order): string {
  const animalLabel =
    order.animalType === 'Chicken'
      ? `${order.quantity} chickens`
      : `1 ${order.animalType}`;

  return (
    `Assalamu Alaikum ${owner.name}! You've been added to a group halal ${animalLabel} order ` +
    `(${order.id}). Your share is $${owner.amount.toFixed(2)}. ` +
    `Please complete your payment at the link below. ` +
    `Delivery to ${order.deliveryAddress} on ${order.deliveryDate}. — Halal Meat Co.`
  );
}
