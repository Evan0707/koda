'use server'

import { inngest } from '@/lib/inngest/client'

import { db } from '@/db'
import { invoices, invoiceItems, quotes, quoteItems } from '@/db/schema/billing'
import { timeEntries, projects } from '@/db/schema/projects'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { InvoiceWithDetails } from '@/types/db'
import { and, desc, eq, ilike, or, sql, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'
import { checkInvoiceLimit, incrementInvoiceCount } from '@/lib/actions/plan-limits'
import { invoiceSchema, updateInvoiceStatusSchema, type CreateInvoiceInput } from '@/lib/schemas/billing'
import { notifyUser } from '@/lib/actions/automation'

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

// ============================================
// CREATE INVOICE (standalone, without quote)
// ============================================
export async function createInvoice(data: CreateInvoiceInput) {
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
        currentPlan: check.currentPlan,
      }
    }

    const validated = invoiceSchema.parse(data)

    // Generate invoice number
    const currentYear = new Date().getFullYear()
    const count = await db.$count(invoices, eq(invoices.organizationId, organizationId))
    const number = `F-${currentYear}-${(count + 1).toString().padStart(4, '0')}`

    // Calculate totals
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

    const invoiceId = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values({
        organizationId,
        createdById: user.id,
        companyId: validated.companyId || null,
        contactId: validated.contactId || null,
        projectId: validated.projectId || null,
        number,
        title: validated.title,
        status: 'draft',
        type: validated.type as any,
        notes: validated.notes,
        issueDate: validated.issueDate || new Date().toISOString(),
        dueDate: validated.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal,
        vatAmount,
        total,
        currency: validated.currency,
      }).returning({ id: invoices.id })

      if (itemsToInsert.length > 0) {
        await tx.insert(invoiceItems).values(
          itemsToInsert.map((item) => ({
            invoiceId: newInvoice.id,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total,
            position: item.position,
          }))
        )
      }

      return newInvoice.id
    })

    revalidatePath('/dashboard/invoices')

    await logAudit({
      action: AUDIT_ACTIONS.INVOICE_CREATED,
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: { number, total: total / 100 },
    })

    await incrementInvoiceCount()

    return { success: true, id: invoiceId }
  } catch (error) {
    console.error('Error creating invoice:', error)
    return { error: 'Erreur lors de la création de la facture' }
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

    // Notify invoice creator
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
    })
    if (invoice?.createdById) {
      if (validated.status === 'paid') {
        await notifyUser(invoice.createdById, organizationId, {
          title: 'Facture payée',
          message: `La facture ${invoice.number} a été marquée comme payée.`,
          type: 'success',
          link: `/dashboard/invoices/${id}`,
          resourceType: 'invoice',
          resourceId: id,
        })
      } else if (validated.status === 'sent') {
        await notifyUser(invoice.createdById, organizationId, {
          title: 'Facture envoyée',
          message: `La facture ${invoice.number} a été envoyée au client.`,
          type: 'info',
          link: `/dashboard/invoices/${id}`,
          resourceType: 'invoice',
          resourceId: id,
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// ============================================
// CREATE INVOICE FROM TIME ENTRIES
// ============================================
export async function createInvoiceFromTime(options: {
  projectId: string
  startDate: string
  endDate: string
  defaultHourlyRate?: number // in euros, fallback if entries have no rate
  vatRate?: number
}) {
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
        currentPlan: check.currentPlan,
      }
    }

    // 1. Fetch project info
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, options.projectId), eq(projects.organizationId, organizationId)),
      with: { company: true },
    })
    if (!project) return { error: 'Projet non trouvé' }

    // 2. Fetch billable time entries in date range
    const entries = await db.query.timeEntries.findMany({
      where: and(
        eq(timeEntries.organizationId, organizationId),
        eq(timeEntries.projectId, options.projectId),
        eq(timeEntries.isBillable, true),
        gte(timeEntries.date, options.startDate),
        lte(timeEntries.date, options.endDate),
      ),
      with: {
        task: { columns: { id: true, title: true } },
      },
      orderBy: [desc(timeEntries.date)],
    })

    if (entries.length === 0) {
      return { error: 'Aucune entrée de temps facturable trouvée pour cette période' }
    }

    const vatRateValue = options.vatRate ?? 20

    // 3. Group entries by hourly rate to create invoice line items
    const rateGroups = new Map<number, { totalMinutes: number; descriptions: string[] }>()

    for (const entry of entries) {
      // hourlyRate is stored in cents in the DB, default fallback is converted to cents
      const rate = entry.hourlyRate ?? (options.defaultHourlyRate ? Math.round(options.defaultHourlyRate * 100) : 0)
      if (!rateGroups.has(rate)) {
        rateGroups.set(rate, { totalMinutes: 0, descriptions: [] })
      }
      const group = rateGroups.get(rate)!
      group.totalMinutes += entry.duration
      const taskLabel = (entry as any).task?.title
      const desc = entry.description || taskLabel || 'Temps de travail'
      if (!group.descriptions.includes(desc)) {
        group.descriptions.push(desc)
      }
    }

    // 4. Build invoice items
    let subtotal = 0
    let totalVat = 0
    const items: {
      description: string
      quantity: number
      unitPrice: number
      vatRate: number
      total: number
      position: number
    }[] = []

    let position = 0
    for (const [rateCents, group] of rateGroups) {
      const hours = Math.round((group.totalMinutes / 60) * 100) / 100 // round to 2 decimals
      const lineDescription = group.descriptions.length <= 3
        ? group.descriptions.join(', ')
        : `${group.descriptions.slice(0, 3).join(', ')} (+${group.descriptions.length - 3} autres)`

      const label = `${project.name} — ${lineDescription} (${hours}h)`
      const lineTotal = Math.round(rateCents * hours) // rateCents * hours = total in cents
      const lineVat = Math.round(lineTotal * (vatRateValue / 100))

      items.push({
        description: label,
        quantity: hours,
        unitPrice: rateCents, // already in cents
        vatRate: vatRateValue,
        total: lineTotal,
        position,
      })

      subtotal += lineTotal
      totalVat += lineVat
      position++
    }

    const total = subtotal + totalVat

    // 5. Generate invoice number
    const currentYear = new Date().getFullYear()
    const count = await db.$count(invoices, eq(invoices.organizationId, organizationId))
    const number = `F-${currentYear}-${(count + 1).toString().padStart(4, '0')}`

    // 6. Create invoice + items in a transaction
    const invoiceId = await db.transaction(async (tx) => {
      const [newInvoice] = await tx.insert(invoices).values({
        organizationId,
        createdById: user.id,
        projectId: options.projectId,
        companyId: project.companyId || null,
        contactId: project.contactId || null,
        number,
        title: `Facturation temps — ${project.name}`,
        status: 'draft',
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subtotal,
        vatAmount: totalVat,
        total,
        currency: 'EUR',
      }).returning({ id: invoices.id })

      if (items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map((item) => ({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            total: item.total,
            position: item.position,
          }))
        )
      }

      return newInvoice.id
    })

    revalidatePath('/dashboard/invoices')
    revalidatePath('/dashboard/time')

    await logAudit({
      action: AUDIT_ACTIONS.INVOICE_CREATED,
      entityType: 'invoice',
      entityId: invoiceId,
      metadata: {
        number,
        total: total / 100,
        fromTimeEntries: true,
        projectId: options.projectId,
        entriesCount: entries.length,
        period: `${options.startDate} → ${options.endDate}`,
      },
    })

    await incrementInvoiceCount()

    return { success: true, id: invoiceId }
  } catch (error) {
    console.error('Error creating invoice from time entries:', error)
    return { error: 'Erreur lors de la création de la facture depuis les heures' }
  }
}
