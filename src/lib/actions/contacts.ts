'use server'

import { db } from '@/db'
import { contacts } from '@/db/schema/crm'
import { createClient } from '@/lib/supabase/server'
import { Contact, Company } from '@/types/db'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull, ilike, or } from 'drizzle-orm'
import { logAudit } from '@/lib/audit'
import { AUDIT_ACTIONS } from '@/db/schema/audit'

// Get user's organization ID
async function getOrganizationId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Non authentifié')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) throw new Error('Organisation non trouvée')

  return profile.organization_id
}

// Create contact
export async function createContact(formData: FormData) {
  const organizationId = await getOrganizationId()

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string | null
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const jobTitle = formData.get('jobTitle') as string | null
  const companyId = formData.get('companyId') as string | null

  if (!firstName) {
    return { error: 'Le prénom est requis' }
  }

  try {
    const [contact] = await db.insert(contacts).values({
      organizationId,
      companyId: companyId || null,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
    }).returning()

    revalidatePath('/dashboard/contacts')

    // Log audit event
    await logAudit({
      action: AUDIT_ACTIONS.CONTACT_CREATED,
      entityType: 'contact',
      entityId: contact.id,
      metadata: { firstName, lastName, email }
    })

    return { success: true, contact: contact as Contact }
  } catch (error) {
    console.error('Error creating contact:', error)
    return { error: 'Erreur lors de la création' }
  }
}

// Update contact
export async function updateContact(id: string, formData: FormData) {
  const organizationId = await getOrganizationId()

  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string | null
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  const jobTitle = formData.get('jobTitle') as string | null
  const companyId = formData.get('companyId') as string | null

  if (!firstName) {
    return { error: 'Le prénom est requis' }
  }

  try {
    const [contact] = await db.update(contacts)
      .set({
        companyId: companyId || null,
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
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
      metadata: { firstName, lastName, email }
    })

    return { success: true, contact: contact as Contact }
  } catch (error) {
    console.error('Error updating contact:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// Soft delete contact
export async function deleteContact(id: string) {
  const organizationId = await getOrganizationId()

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
