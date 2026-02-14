// Currency utilities for multi-currency support

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF'

export const CURRENCIES: { code: Currency; name: string; symbol: string; locale: string }[] = [
 { code: 'EUR', name: 'Euro', symbol: '€', locale: 'fr-FR' },
 { code: 'USD', name: 'Dollar US', symbol: '$', locale: 'en-US' },
 { code: 'GBP', name: 'Livre Sterling', symbol: '£', locale: 'en-GB' },
 { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF', locale: 'de-CH' },
]

export function getCurrencyInfo(code: string) {
 return CURRENCIES.find(c => c.code === code) || CURRENCIES[0]
}

/**
 * Format a price in cents to a localized currency string
 */
export function formatPrice(cents: number | null, currencyCode: string = 'EUR', options?: { compact?: boolean }): string {
 if (cents === null || cents === undefined) return '0,00 €'

 const currency = getCurrencyInfo(currencyCode)

 return new Intl.NumberFormat(currency.locale, {
  style: 'currency',
  currency: currency.code,
  minimumFractionDigits: options?.compact ? 0 : 2,
  maximumFractionDigits: 2,
 }).format(cents / 100)
}

/**
 * Format a price in euros (not cents) to a localized currency string
 */
export function formatPriceFromEuros(euros: number | null, currencyCode: string = 'EUR'): string {
 if (euros === null || euros === undefined) return '0,00 €'

 const currency = getCurrencyInfo(currencyCode)

 return new Intl.NumberFormat(currency.locale, {
  style: 'currency',
  currency: currency.code,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
 }).format(euros)
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(currencyCode: string = 'EUR'): string {
 return getCurrencyInfo(currencyCode).symbol
}
