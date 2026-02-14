'use server'

import { inngest } from '@/lib/inngest/client'

import { db } from '@/db'
import { invoices, invoiceItems, quotes, quoteItems } from '@/db/schema/billing'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { InvoiceWithDetails } from '@/types/db'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'
import { checkInvoiceLimit, incrementInvoiceCount } from '@/lib/actions/plan-limits'

export async function getInvoices(query?: string) {
  try {
    const organizationId = await getOrganizationId()

    const conditions = [eq(invoices.organizationId, organizationId)]

    if (query) {
      conditions.push(or(
        ilike(invoices.number, `%${query}%`),
        ilike(invoices.title, `%${query}%`)
      )!)
    }

    const data = await db.query.invoices.findMany({
      where: and(...conditions),
      with: {
        company: true,
        contact: true,
      },
      orderBy: [desc(invoices.createdAt)],
    })

    return { invoices: data as InvoiceWithDetails[] }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return { error: 'Erreur lors de la récupération des factures' }
  }
}

export async function getInvoice(id: string) {
  try {
    const organizationId = await getOrganizationId()

    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
      with: {
        company: true,
        contact: true,
        items: {
          orderBy: (items, { asc }) => [asc(items.position)]
        }
      }
    })

    if (!invoice) return { error: 'Facture non trouvée' }
    return { invoice: invoice as InvoiceWithDetails }
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return { error: 'Erreur lors de la récupération de la facture' }
  }
}

export async function convertQuoteToInvoice(quoteId: string) {
  try {
    const auth = await requirePermission('manage_invoices')
    if ('error' in auth) return { error: auth.error }
    const { user } = auth
    const organizationId = user.organizationId!

    const check = await checkInvoiceLimit()
    if (!check.canCreate) {
      return {
        error: check.error,
        upgradeRequired: check.upgradeRequired,
        currentPlan: check.currentPlan
      }
    }

    // 1. Fetch Quote
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, quoteId), eq(quotes.organizationId, organizationId)),
      with: { items: true }
    })

    if (!quote) return { error: 'Devis introuvable' }

    // 2. Generate Invoice Number
    const currentYear = new Date().getFullYear()
    const count = await db.$count(invoices, eq(invoices.organizationId, organizationId));
    const number = `F-${currentYear}-${(count + 1).toString().padStart(4, '0')}`

    // 3. Create Invoice & Items
    const invoiceId = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values({
        organizationId,
        createdById: user.id,
        quoteId: quote.id,
        companyId: quote.companyId,
        contactId: quote.contactId,
        number,
        title: quote.title,
        status: 'draft',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: quote.subtotal,
        vatAmount: quote.vatAmount,
        total: quote.total,
        currency: quote.currency,
      }).returning({ id: invoices.id })

      if (quote.items && quote.items.length > 0) {
        await tx.insert(invoiceItems).values(
          quote.items.map(item => ({
            invoiceId: newInvoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total,
            position: item.position
          }))
        )
      }

      return newInvoice.id
    })

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/quotes/${quoteId}`)

    // Log audit event
    await logAudit({
      action: AUDIT_ACTIONS.INVOICE_CREATED,
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: { number, fromQuote: quoteId }
    })

    await incrementInvoiceCount()

    return { success: true, id: invoiceId }

  } catch (error) {
    console.error('Error converting quote to invoice:', error)
    return { error: 'Erreur lors de la création de la facture' }
  }
}



import { updateInvoiceStatusSchema } from '@/lib/schemas/billing'

export async function updateInvoiceStatus(id: string, status: string) {
  try {
    // Validate status
    const validated = updateInvoiceStatusSchema.parse({ status })

    // Permission check for all status changes
    const auth = await requirePermission('manage_invoices')
    if ('error' in auth) return { error: auth.error }

    // Additional check for marking as paid
    if (validated.status === 'paid') {
      const paidAuth = await requirePermission('mark_invoice_paid')
      if ('error' in paidAuth) return { error: paidAuth.error }
    }

    const organizationId = await getOrganizationId()

    const updateData: { status: typeof validated.status; updatedAt: Date; paidAt?: Date; paidAmount?: any } = {
      status: validated.status,
      updatedAt: new Date()
    }

    if (validated.status === 'paid') {
      updateData.paidAt = new Date()
      updateData.paidAmount = sql`${invoices.total}` // Assume full payment for now
    }

    await db.update(invoices)
      .set(updateData)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))

    if (status === 'sent') {
      await inngest.send({
        name: 'invoice.sent',
        data: {
          invoiceId: id,
        }
      })
    }

    revalidatePath('/dashboard/invoices')
    revalidatePath(`/dashboard/invoices/${id}`)

    // Log audit event
    const actionType = status === 'paid' ? AUDIT_ACTIONS.INVOICE_PAID
      : status === 'sent' ? AUDIT_ACTIONS.INVOICE_SENT
        : AUDIT_ACTIONS.INVOICE_UPDATED
    await logAudit({
      action: actionType,
      entityType: 'invoice',
      entityId: id,
      metadata: { status }
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}
