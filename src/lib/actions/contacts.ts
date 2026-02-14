'use server'

import { db } from '@/db'
import { contacts } from '@/db/schema/crm'
import { Contact, Company } from '@/types/db'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull, ilike, or } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'
import { checkContactLimit } from '@/lib/actions/plan-limits'
import { z } from 'zod'
import { getOrganizationId, requirePermission } from '@/lib/auth'

import { contactSchema } from '@/lib/schemas/crm'

// Create contact
export async function createContact(formData: FormData) {
  const auth = await requirePermission('manage_contacts')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  try {
    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      jobTitle: formData.get('jobTitle'),
      companyId: formData.get('companyId'),
    }

    const validated = contactSchema.parse(rawData)

    const check = await checkContactLimit()
    if (!check.canCreate) {
      return {
        error: check.error,
        upgradeRequired: check.upgradeRequired,
        currentPlan: check.currentPlan
      }
    }

    const [contact] = await db.insert(contacts).values({
      organizationId,
      companyId: validated.companyId || null,
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email || null,
      phone: validated.phone,
      jobTitle: validated.jobTitle,
    }).returning()

    revalidatePath('/dashboard/contacts')

    // Log audit event
    await logAudit({
      action: AUDIT_ACTIONS.CONTACT_CREATED,
      entityType: 'contact',
      entityId: contact.id,
      metadata: { firstName: validated.firstName, lastName: validated.lastName, email: validated.email }
    })

    return { success: true, contact: contact as Contact }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error('Error creating contact:', error)
    return { error: 'Erreur lors de la création' }
  }
}

// Update contact
export async function updateContact(id: string, formData: FormData) {
  const auth = await requirePermission('manage_contacts')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  try {
    const rawData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      jobTitle: formData.get('jobTitle'),
      companyId: formData.get('companyId'),
    }

    const validated = contactSchema.parse(rawData)

    const [contact] = await db.update(contacts)
      .set({
        companyId: validated.companyId || null,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone,
        jobTitle: validated.jobTitle,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId),
        isNull(contacts.deletedAt)
      ))
      .returning()

    revalidatePath('/dashboard/contacts')

    // Log audit event
    await logAudit({
      action: AUDIT_ACTIONS.CONTACT_UPDATED,
      entityType: 'contact',
      entityId: id,
      metadata: { firstName: validated.firstName, lastName: validated.lastName, email: validated.email }
    })

    return { success: true, contact: contact as Contact }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0].message }
    }
    console.error('Error updating contact:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// Soft delete contact
export async function deleteContact(id: string) {
  const auth = await requirePermission('manage_contacts')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  try {
    await db.update(contacts)
      .set({ deletedAt: new Date() })
      .where(and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId)
      ))

    revalidatePath('/dashboard/contacts')

    // Log audit event
    await logAudit({
      action: AUDIT_ACTIONS.CONTACT_DELETED,
      entityType: 'contact',
      entityId: id,
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting contact:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// Get all contacts with optional company data
export async function getContacts(search?: string) {
  const organizationId = await getOrganizationId()

  try {
    const conditions = [
      eq(contacts.organizationId, organizationId),
      isNull(contacts.deletedAt)
    ]

    if (search) {
      conditions.push(
        or(
          ilike(contacts.firstName, `%${search}%`),
          ilike(contacts.lastName, `%${search}%`),
          ilike(contacts.email, `%${search}%`)
        )!
      )
    }

    const data = await db.query.contacts.findMany({
      where: and(...conditions),
      with: {
        company: true
      },
      orderBy: (contacts, { asc }) => [asc(contacts.firstName)]
    })

    return { contacts: data as (Contact & { company: Company | null })[] }
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return { error: 'Erreur lors du chargement', contacts: [] }
  }
}

// Get single contact
export async function getContact(id: string) {
  const organizationId = await getOrganizationId()

  try {
    const contact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.id, id),
        eq(contacts.organizationId, organizationId),
        isNull(contacts.deletedAt)
      ),
      with: {
        company: true
      }
    })

    if (!contact) return { error: 'Contact non trouvé' }
    return { contact: contact as (Contact & { company: Company | null }) }
  } catch (error) {
    console.error('Error fetching contact:', error)
    return { error: 'Erreur lors du chargement' }
  }
}
