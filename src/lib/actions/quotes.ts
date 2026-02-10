'use server'

import { db } from '@/db'
import { quotes, quoteItems } from '@/db/schema/billing'
import { getOrganizationId, getUser } from '@/lib/auth'
import { QuoteWithDetails } from '@/types/db'
import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'

// Schema for quote items
const quoteItemSchema = z.object({
 productId: z.string().optional(),
 description: z.string().min(1, 'Description requise'),
 quantity: z.coerce.number().min(1, 'Quantité minimum 1'),
 unitPrice: z.coerce.number().min(0, 'Prix positif requis'),
 vatRate: z.coerce.number().min(0).default(20),
})

// Schema for quote creation
const quoteSchema = z.object({
 title: z.string().optional(),
 contactId: z.string().nullable().optional(),
 companyId: z.string().nullable().optional(),
 issueDate: z.string().optional(),
 validUntil: z.string().optional(),
 currency: z.string().default('EUR'),
 status: z.enum(['draft', 'sent', 'accepted', 'rejected']).default('draft'),
 items: z.array(quoteItemSchema).min(1, 'Au moins une ligne est requise'),
})

export async function getQuotes(query?: string) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [eq(quotes.organizationId, organizationId)]

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

export async function createQuote(data: any) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

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
    createdById: user?.id,
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
  const organizationId = await getOrganizationId()

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

  return { success: true }
 } catch (error) {
  console.error('Error updating quote status:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}
