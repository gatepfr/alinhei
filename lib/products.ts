export const DEFAULT_PRODUCTS = {
  single: { label: '1 análise completa', price: 9.90, credits: 1, expirationDays: 30 },
  pack3: { label: '3 análises completas', price: 19.90, credits: 3, expirationDays: 30 },
  pack10: { label: '10 análises completas', price: 49.90, credits: 10, expirationDays: 90 },
} as const

export const PRODUCTS = DEFAULT_PRODUCTS

export type Products = typeof DEFAULT_PRODUCTS
export type ProductSku = keyof Products
