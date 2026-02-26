// Fee calculation utilities for TCGHub

// Seller fees based on account type
export const SELLER_FEE_RATES = {
  individual: 0.05, // CPF: 5%
  business: 0.02,   // CNPJ: 2%
} as const;

// Buyer fees based on payment method (for future checkout)
export const BUYER_FEE_RATES = {
  card: 0.04, // Cartão: 4%
  pix: 0.01,  // PIX: 1%
} as const;

export type AccountType = "individual" | "business";

export function getSellerFeeRate(accountType: AccountType): number {
  return SELLER_FEE_RATES[accountType] ?? SELLER_FEE_RATES.individual;
}

export function getSellerFeeLabel(accountType: AccountType): string {
  const rate = getSellerFeeRate(accountType);
  return `${(rate * 100).toFixed(0)}%`;
}

export function calculateSellerFee(priceCents: number, accountType: AccountType) {
  const rate = getSellerFeeRate(accountType);
  const feeCents = Math.round(priceCents * rate);
  const netCents = priceCents - feeCents;
  return { feeCents, netCents, rate };
}

export function calculateBuyerFee(subtotalCents: number, shippingCents: number, method: "card" | "pix") {
  const base = subtotalCents + shippingCents;
  const rate = BUYER_FEE_RATES[method];
  const feeCents = Math.round(base * rate);
  const totalCents = base + feeCents;
  return { feeCents, totalCents, rate };
}
