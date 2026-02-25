'use server'

import { db } from '@/db'
import { quotes, quoteItems } from '@/db/schema/billing'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { QuoteWithDetails } from '@/types/db'
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'
import { checkQuoteLimit } from '@/lib/actions/plan-limits'

import { quoteSchema, type CreateQuoteInput } from '@/lib/schemas/billing'
import { notifyUser } from '@/lib/actions/automation'

// Schema imported from @/lib/schemas/billing



export async function getQuotes(query?: string) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [
   eq(quotes.organizationId, organizationId),
   isNull(quotes.deletedAt), // Exclude archived/deleted
  ]

  if (query) {
   conditions.push(or(
    ilike(quotes.number, `%${query}%`),
    ilike(quotes.title, `%${query}%`)
   )!)
  }

  const data = await db.query.quotes.findMany({
   where: and(...conditions),
   with: {
    company: true,
    contact: true,
   },
   orderBy: [desc(quotes.createdAt)],
  })

  return { quotes: data as QuoteWithDetails[] }
 } catch (error) {
  console.error('Error fetching quotes:', error)
  return { error: 'Erreur lors de la récupération des devis' }
 }
}

export async function archiveQuote(id: string) {
 try {
  const auth = await requirePermission('manage_quotes')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  await db.update(quotes)
   .set({ deletedAt: new Date(), updatedAt: new Date() })
   .where(and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)))

  revalidatePath('/dashboard/quotes')

  await logAudit({
   action: AUDIT_ACTIONS.QUOTE_UPDATED,
   entityType: 'quote',
   entityId: id,
   metadata: { archived: true }
  })

  return { success: true }
 } catch (error) {
  console.error('Error archiving quote:', error)
  return { error: 'Erreur lors de l\'archivage du devis' }
 }
}

export async function getQuote(id: string) {
 try {
  const organizationId = await getOrganizationId()

  const quote = await db.query.quotes.findFirst({
   where: and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)),
   with: {
    company: true,
    contact: true,
    items: {
     orderBy: (items, { asc }) => [asc(items.position)]
    }
   }
  })

  if (!quote) return { error: 'Devis non trouvé' }
  return { quote: quote as QuoteWithDetails }
 } catch (error) {
  console.error('Error fetching quote:', error)
  return { error: 'Erreur lors de la récupération du devis' }
 }
}

export async function createQuote(data: CreateQuoteInput) {
 try {
  const auth = await requirePermission('manage_quotes')
  if ('error' in auth) return { error: auth.error }
  const { user } = auth
  const organizationId = user.organizationId!

  const check = await checkQuoteLimit()
  if (!check.canCreate) {
   return {
    error: check.error,
    upgradeRequired: check.upgradeRequired,
    currentPlan: check.currentPlan
   }
  }

  // Validation ensures data integrity even if types match
  const validated = quoteSchema.parse(data)

  const count = await db.$count(quotes, eq(quotes.organizationId, organizationId));
  const number = `D-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`

  let subtotal = 0
  let vatAmount = 0

  const itemsToInsert = validated.items.map((item, index) => {
   const lineTotal = Math.round(item.unitPrice * 100 * item.quantity)
   const lineVat = Math.round(lineTotal * (item.vatRate / 100))

   subtotal += lineTotal
   vatAmount += lineVat

   return {
    ...item,
    unitPrice: Math.round(item.unitPrice * 100),
    total: lineTotal,
    position: index,
    productId: item.productId || null,
   }
  })

  const total = subtotal + vatAmount

  const quoteId = await db.transaction(async (tx) => {
   const [newQuote] = await tx.insert(quotes).values({
    organizationId,
    createdById: user.id,
    number,
    title: validated.title,
    contactId: validated.contactId || null,
    companyId: validated.companyId || null,
    status: validated.status as any,
    currency: validated.currency,
    issueDate: validated.issueDate || new Date().toISOString(),
    validUntil: validated.validUntil || undefined,
    subtotal,
    vatAmount,
    total,
   }).returning({ id: quotes.id })

   if (itemsToInsert.length > 0) {
    await tx.insert(quoteItems).values(
     itemsToInsert.map(item => ({
      quoteId: newQuote.id,
      ...item
     }))
    )
   }

   return newQuote.id
  })

  revalidatePath('/dashboard/quotes')

  // Log audit event
  await logAudit({
   action: AUDIT_ACTIONS.QUOTE_CREATED,
   entityType: 'quote',
   entityId: quoteId,
   metadata: { number, total: total / 100 }
  })

  return { success: true, id: quoteId }

 } catch (error) {
  console.error('Error creating quote:', error)
  return { error: 'Erreur lors de la création du devis' }
 }
}

export async function updateQuoteStatus(id: string, status: string) {
 try {
  const auth = await requirePermission('manage_quotes')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  await db.update(quotes)
   .set({ status: status as any, updatedAt: new Date() })
   .where(and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)))

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/quotes/${id}`)

  // Log audit event
  await logAudit({
   action: status === 'accepted' ? AUDIT_ACTIONS.QUOTE_SIGNED : AUDIT_ACTIONS.QUOTE_UPDATED,
   entityType: 'quote',
   entityId: id,
   metadata: { status }
  })

  // Notify quote creator on signature or rejection
  if (status === 'accepted' || status === 'rejected') {
   const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)),
   })
   if (quote?.createdById) {
    await notifyUser(quote.createdById, organizationId, {
     title: status === 'accepted' ? 'Devis signé !' : 'Devis refusé',
     message: status === 'accepted'
      ? `Le devis ${quote.number} a été signé par le client.`
      : `Le devis ${quote.number} a été refusé.`,
     type: status === 'accepted' ? 'success' : 'warning',
     link: `/dashboard/quotes/${id}`,
     resourceType: 'quote',
     resourceId: id,
    })
   }
  }

  return { success: true }
 } catch (error) {
  console.error('Error updating quote status:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// ============================================
// UPDATE QUOTE (edit content + items)
// ============================================
export async function updateQuote(id: string, data: CreateQuoteInput) {
 try {
  const auth = await requirePermission('manage_quotes')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  const validated = quoteSchema.parse(data)

  // Verify quote exists + belongs to org
  const existing = await db.query.quotes.findFirst({
   where: and(eq(quotes.id, id), eq(quotes.organizationId, organizationId)),
  })
  if (!existing) return { error: 'Devis non trouvé' }

  // Only draft/rejected quotes can be edited
  if (existing.status !== 'draft' && existing.status !== 'rejected') {
   return { error: 'Seuls les devis en brouillon ou refusés peuvent être modifiés' }
  }

  let subtotal = 0
  let vatAmount = 0

  const itemsToInsert = validated.items.map((item, index) => {
   const lineTotal = Math.round(item.unitPrice * 100 * item.quantity)
   const lineVat = Math.round(lineTotal * (item.vatRate / 100))
   subtotal += lineTotal
   vatAmount += lineVat
   return {
    ...item,
    unitPrice: Math.round(item.unitPrice * 100),
    total: lineTotal,
    position: index,
    productId: item.productId || null,
   }
  })

  const total = subtotal + vatAmount

  await db.transaction(async (tx) => {
   // Update quote fields
   await tx.update(quotes).set({
    title: validated.title,
    contactId: validated.contactId || null,
    companyId: validated.companyId || null,
    currency: validated.currency,
    issueDate: validated.issueDate || undefined,
    validUntil: validated.validUntil || undefined,
    subtotal,
    vatAmount,
    total,
    status: 'draft', // reset to draft on edit
    updatedAt: new Date(),
   }).where(eq(quotes.id, id))

   // Delete old items + insert new
   await tx.delete(quoteItems).where(eq(quoteItems.quoteId, id))
   if (itemsToInsert.length > 0) {
    await tx.insert(quoteItems).values(
     itemsToInsert.map(item => ({ quoteId: id, ...item }))
    )
   }
  })

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/quotes/${id}`)

  await logAudit({
   action: AUDIT_ACTIONS.QUOTE_UPDATED,
   entityType: 'quote',
   entityId: id,
   metadata: { total: total / 100 },
  })

  return { success: true }
 } catch (error) {
  console.error('Error updating quote:', error)
  return { error: 'Erreur lors de la modification du devis' }
 }
}
