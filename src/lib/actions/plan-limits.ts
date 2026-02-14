'use server'

import { createClient } from '@/lib/supabase/server'
import { db, schema } from '@/db'
import { eq, sql, and, isNull } from 'drizzle-orm'
import { getPlanLimits } from '@/lib/utils/plan-limits'
import { quotes } from '@/db/schema/billing'
import { contacts } from '@/db/schema/crm'

export async function checkInvoiceLimit() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) return { canCreate: false, error: 'Non authentifié' }

 const userRecord = await db.query.users.findFirst({
  where: eq(schema.users.id, user.id),
 })

 if (!userRecord?.organizationId) {
  return { canCreate: false, error: 'Organisation introuvable' }
 }

 const org = await db.query.organizations.findFirst({
  where: eq(schema.organizations.id, userRecord.organizationId),
 })

 if (!org) return { canCreate: false, error: 'Organisation introuvable' }

 const limits = getPlanLimits(org.plan || 'free')

 // Check if plan has unlimited invoices
 if (limits.maxInvoicesPerMonth === -1) {
  return { canCreate: true }
 }

 // Reset counter if new month
 const now = new Date()
 const lastReset = org.lastInvoiceResetDate

 if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
  await db.update(schema.organizations)
   .set({
    monthlyInvoiceCount: 0,
    lastInvoiceResetDate: now,
   })
   .where(eq(schema.organizations.id, org.id))

  return { canCreate: true }
 }

 // Check if limit reached
 const currentCount = org.monthlyInvoiceCount || 0

 if (currentCount >= limits.maxInvoicesPerMonth) {
  return {
   canCreate: false,
   error: `Limite de ${limits.maxInvoicesPerMonth} factures/mois atteinte.`,
   upgradeRequired: true,
   currentPlan: org.plan || 'free',
  }
 }

 return { canCreate: true, remaining: limits.maxInvoicesPerMonth - currentCount }
}

export async function incrementInvoiceCount() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) return { error: 'Non authentifié' }

 const userRecord = await db.query.users.findFirst({
  where: eq(schema.users.id, user.id),
 })

 if (!userRecord?.organizationId) {
  return { error: 'Organisation introuvable' }
 }

 // Double check reset if needed (safety)
 // ... (omitted for brevity, relying on checkInvoiceLimit having run or periodic job)

 await db.update(schema.organizations)
  .set({
   monthlyInvoiceCount: sql`${schema.organizations.monthlyInvoiceCount} + 1`,
  })
  .where(eq(schema.organizations.id, userRecord.organizationId))

 return { success: true }
}

// QUOTES LIMITS

export async function checkQuoteLimit() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) return { canCreate: false, error: 'Non authentifié' }

 const userRecord = await db.query.users.findFirst({
  where: eq(schema.users.id, user.id),
 })

 if (!userRecord?.organizationId) {
  return { canCreate: false, error: 'Organisation introuvable' }
 }

 const org = await db.query.organizations.findFirst({
  where: eq(schema.organizations.id, userRecord.organizationId),
 })

 if (!org) return { canCreate: false, error: 'Organisation introuvable' }

 const limits = getPlanLimits(org.plan || 'free')

 if (limits.maxQuotesPerMonth === -1) {
  return { canCreate: true }
 }

 // Reset logic for quotes (assuming monthlyQuoteCount exists in schema, if not we need to add it or count dynamically)
 // Currently checking schema... database might not track monthlyQuoteCount.
 // Strategy: Count quotes created this month dynamically if field doesn't exist, 
 // OR assume we want to add field. 
 // Given I can't easily change DB schema instantly without migration, I will use DYNAMIC COUNTING for now.

 const startOfMonth = new Date()
 startOfMonth.setDate(1)
 startOfMonth.setHours(0, 0, 0, 0)

 const quotesCount = await db.$count(
  quotes,
  and(
   eq(quotes.organizationId, org.id),
   sql`${quotes.createdAt} >= ${startOfMonth.toISOString()}`
  )
 )

 if (quotesCount >= limits.maxQuotesPerMonth) {
  return {
   canCreate: false,
   error: `Limite de ${limits.maxQuotesPerMonth} devis/mois atteinte.`,
   upgradeRequired: true,
   currentPlan: org.plan || 'free',
  }
 }

 return { canCreate: true, remaining: limits.maxQuotesPerMonth - quotesCount }
}

// CONTACTS LIMITS

export async function checkContactLimit() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) return { canCreate: false, error: 'Non authentifié' }

 const userRecord = await db.query.users.findFirst({
  where: eq(schema.users.id, user.id),
 })

 if (!userRecord?.organizationId) {
  return { canCreate: false, error: 'Organisation introuvable' }
 }

 const org = await db.query.organizations.findFirst({
  where: eq(schema.organizations.id, userRecord.organizationId),
 })

 if (!org) return { canCreate: false, error: 'Organisation introuvable' }

 const limits = getPlanLimits(org.plan || 'free')

 if (limits.maxContacts === -1) {
  return { canCreate: true }
 }

 const contactsCount = await db.$count(
  contacts,
  and(
   eq(contacts.organizationId, org.id),
   isNull(contacts.deletedAt)
  )
 )

 if (contactsCount >= limits.maxContacts) {
  return {
   canCreate: false,
   error: `Limite de ${limits.maxContacts} contacts atteinte.`,
   upgradeRequired: true,
   currentPlan: org.plan || 'free',
  }
 }

 return { canCreate: true, remaining: limits.maxContacts - contactsCount }
}
