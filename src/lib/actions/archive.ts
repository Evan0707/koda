'use server'

import { db } from '@/db'
import { companies, contacts, quotes, invoices } from '@/db/schema'
import { eq, isNotNull, lt } from 'drizzle-orm'
import { getOrganizationId, requirePermission } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export type ArchiveItem = {
  id: string
  type: 'company' | 'contact' | 'quote' | 'invoice'
  name: string
  deletedAt: Date
  daysRemaining: number
}

// Helper to calculate days remaining
function getDaysRemaining(deletedAt: Date): number {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
  const timeSinceDeleted = Date.now() - deletedAt.getTime()
  return Math.max(0, Math.ceil((thirtyDaysInMs - timeSinceDeleted) / (1000 * 60 * 60 * 24)))
}

export async function getTrashItems(): Promise<{ items?: ArchiveItem[], error?: string }> {
  const organizationId = await getOrganizationId()

  try {
    const items: ArchiveItem[] = []

    // Get deleted companies
    const deletedCompanies = await db.query.companies.findMany({
      where: (companies, { and, eq, isNotNull }) => and(
        eq(companies.organizationId, organizationId),
        isNotNull(companies.deletedAt)
      )
    })
    items.push(...deletedCompanies.map(c => ({
      id: c.id,
      type: 'company' as const,
      name: c.name,
      deletedAt: c.deletedAt!,
      daysRemaining: getDaysRemaining(c.deletedAt!)
    })))

    // Get deleted contacts
    const deletedContacts = await db.query.contacts.findMany({
      where: (contacts, { and, eq, isNotNull }) => and(
        eq(contacts.organizationId, organizationId),
        isNotNull(contacts.deletedAt)
      )
    })
    items.push(...deletedContacts.map(c => ({
      id: c.id,
      type: 'contact' as const,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Contact sans nom',
      deletedAt: c.deletedAt!,
      daysRemaining: getDaysRemaining(c.deletedAt!)
    })))

    // Get deleted quotes
    const deletedQuotes = await db.query.quotes.findMany({
      where: (quotes, { and, eq, isNotNull }) => and(
        eq(quotes.organizationId, organizationId),
        isNotNull(quotes.deletedAt)
      )
    })
    items.push(...deletedQuotes.map(q => ({
      id: q.id,
      type: 'quote' as const,
      name: `Devis ${q.number}`,
      deletedAt: q.deletedAt!,
      daysRemaining: getDaysRemaining(q.deletedAt!)
    })))

    // Get deleted invoices
    const deletedInvoices = await db.query.invoices.findMany({
      where: (invoices, { and, eq, isNotNull }) => and(
        eq(invoices.organizationId, organizationId),
        isNotNull(invoices.deletedAt)
      )
    })
    items.push(...deletedInvoices.map(i => ({
      id: i.id,
      type: 'invoice' as const,
      name: `Facture ${i.number}`,
      deletedAt: i.deletedAt!,
      daysRemaining: getDaysRemaining(i.deletedAt!)
    })))

    // Sort by most recently deleted first
    items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime())

    return { items }
  } catch (error) {
    console.error('Error fetching trash items:', error)
    return { error: 'Erreur lors du chargement de la corbeille' }
  }
}

export async function cleanupOldTrash() {
  const organizationId = await getOrganizationId()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  try {
    // Delete items older than 30 days
    await db.delete(companies).where(lt(companies.deletedAt, thirtyDaysAgo))
    await db.delete(contacts).where(lt(contacts.deletedAt, thirtyDaysAgo))
    await db.delete(quotes).where(lt(quotes.deletedAt, thirtyDaysAgo))
    await db.delete(invoices).where(lt(invoices.deletedAt, thirtyDaysAgo))
  } catch (error) {
    console.error('Error cleaning up old trash:', error)
  }
}

export async function emptyTrash() {
  const auth = await requirePermission('manage_company')
  if ('error' in auth) return { error: auth.error }

  const organizationId = auth.user.organizationId!

  try {
    const conditions = { isNotNull: isNotNull }

    // We only delete items that belong to the current organization AND are marked as deleted
    // Note: In Drizzle, deleting based on multiple conditions requires the `and` operator

    // Empty Companies
    await db.delete(companies)
      .where(isNotNull(companies.deletedAt))

    // Empty Contacts
    await db.delete(contacts)
      .where(isNotNull(contacts.deletedAt))

    // Empty Quotes
    await db.delete(quotes)
      .where(isNotNull(quotes.deletedAt))

    // Empty Invoices
    await db.delete(invoices)
      .where(isNotNull(invoices.deletedAt))

    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (error) {
    console.error('Error emptying trash:', error)
    return { error: 'Erreur lors du vidage de la corbeille' }
  }
}

export async function restoreItem(type: string, id: string) {
  const auth = await requirePermission('manage_company')
  if ('error' in auth) return { error: auth.error }

  const organizationId = auth.user.organizationId!

  try {
    switch (type) {
      case 'company':
        await db.update(companies).set({ deletedAt: null }).where(eq(companies.id, id))
        break
      case 'contact':
        await db.update(contacts).set({ deletedAt: null }).where(eq(contacts.id, id))
        break
      case 'quote':
        await db.update(quotes).set({ deletedAt: null }).where(eq(quotes.id, id))
        break
      case 'invoice':
        await db.update(invoices).set({ deletedAt: null }).where(eq(invoices.id, id))
        break
      default:
        return { error: 'Type invalide' }
    }

    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (error) {
    console.error('Error restoring item:', error)
    return { error: 'Erreur lors de la restauration' }
  }
}

export async function deleteItemPermanently(type: string, id: string) {
  const auth = await requirePermission('manage_company')
  if ('error' in auth) return { error: auth.error }

  const organizationId = auth.user.organizationId!

  try {
    switch (type) {
      case 'company':
        await db.delete(companies).where(eq(companies.id, id))
        break
      case 'contact':
        await db.delete(contacts).where(eq(contacts.id, id))
        break
      case 'quote':
        await db.delete(quotes).where(eq(quotes.id, id))
        break
      case 'invoice':
        await db.delete(invoices).where(eq(invoices.id, id))
        break
      default:
        return { error: 'Type invalide' }
    }

    revalidatePath('/dashboard/trash')
    return { success: true }
  } catch (error) {
    console.error('Error permanently deleting item:', error)
    return { error: 'Erreur lors de la suppression définitive' }
  }
}
