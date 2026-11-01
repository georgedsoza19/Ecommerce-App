export function applyCouponDiscount(params: {
  subtotalCents: number;
  type: 'PERCENT' | 'FIXED';
  value: number;
  maxDiscountCents?: number | null;
}): number {
  const { subtotalCents, type, value, maxDiscountCents } = params;
  let discount =
    type === 'PERCENT'
      ? Math.floor((subtotalCents * value) / 100)
      : Math.floor(value);

  if (maxDiscountCents != null && maxDiscountCents > 0) {
    discount = Math.min(discount, maxDiscountCents);
  }

  return Math.max(0, Math.min(discount, subtotalCents));
}

export function computeShippingCents(params: {
  subtotalAfterDiscountCents: number;
  flatShippingCents: number;
  freeShippingThresholdCents: number;
}): number {
  const { subtotalAfterDiscountCents, flatShippingCents, freeShippingThresholdCents } =
    params;
  if (
    freeShippingThresholdCents > 0 &&
    subtotalAfterDiscountCents >= freeShippingThresholdCents
  ) {
    return 0;
  }
  return flatShippingCents;
}

export function computeTaxCents(params: {
  taxableCents: number;
  taxRateBps: number;
}): number {
  return Math.floor((params.taxableCents * params.taxRateBps) / 10000);
}

export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}
