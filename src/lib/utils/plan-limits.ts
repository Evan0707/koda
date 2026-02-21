export const PLAN_LIMITS = {
 free: {
  maxInvoicesPerMonth: 10,
  maxQuotesPerMonth: 10,
  maxContacts: 50,
  maxProjects: 5,
  paymentMethods: ['stripe'],
  features: ['basic_invoicing', 'email_sending'],
 },
 starter: {
  maxInvoicesPerMonth: 100,
  maxQuotesPerMonth: 100,
  maxContacts: 500,
  maxProjects: 50,
  paymentMethods: ['stripe', 'paypal', 'bank_transfer', 'cash', 'check'],
  features: ['basic_invoicing', 'email_sending', 'ai_email', 'templates', 'quotes'],
 },
 pro: {
  maxInvoicesPerMonth: -1, // unlimited
  maxQuotesPerMonth: -1,
  maxContacts: -1,
  maxProjects: -1,
  paymentMethods: ['stripe', 'paypal', 'bank_transfer', 'cash', 'check'],
  features: ['all'],
 },
} as const

// Pricing display (in euros)
export const PLAN_PRICING = {
 starter: {
  monthly: 19,
  annual: 15, // per month, billed yearly (180€/an → -21%)
  annualTotal: 180,
 },
 pro: {
  monthly: 49,
  annual: 39, // per month, billed yearly (468€/an → -20%)
  annualTotal: 468,
 },
} as const

// Free trial configuration
export const TRIAL_DAYS = 14

export type BillingPeriod = 'monthly' | 'annual'

export type PlanType = keyof typeof PLAN_LIMITS

export function getPlanLimits(plan: string) {
 return PLAN_LIMITS[plan as PlanType] || PLAN_LIMITS.free
}

export function hasFeature(plan: string, feature: string): boolean {
 const limits = getPlanLimits(plan)
 const features = limits.features as any
 return features.includes('all') || features.includes(feature)
}

export function hasPaymentMethod(plan: string, method: string): boolean {
 const limits = getPlanLimits(plan)
 const methods = limits.paymentMethods as any
 return methods.includes(method)
}
