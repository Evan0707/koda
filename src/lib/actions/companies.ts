'use server'

import { db } from '@/db'
import { companies } from '@/db/schema/crm'
import { Company } from '@/types/db'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull, ilike, or } from 'drizzle-orm'
import { getOrganizationId, requirePermission } from '@/lib/auth'

// Create company
export async function createCompany(formData: FormData) {
 const auth = await requirePermission('manage_contacts')
 if ('error' in auth) return { error: auth.error }
 const organizationId = auth.user.organizationId!

 const name = formData.get('name') as string
 const website = formData.get('website') as string | null
 const industry = formData.get('industry') as string | null
 const size = formData.get('size') as string | null
 const siret = formData.get('siret') as string | null
 const vatNumber = formData.get('vatNumber') as string | null
 const address = formData.get('address') as string | null
 const city = formData.get('city') as string | null
 const postalCode = formData.get('postalCode') as string | null
 const country = formData.get('country') as string | null

 if (!name) {
  return { error: 'Le nom est requis' }
 }

 try {
  const [company] = await db.insert(companies).values({
   organizationId,
   name,
   website,
   industry,
   size,
   siret,
   vatNumber,
   address,
   city,
   postalCode,
   country: country || 'FR',
  }).returning()

  revalidatePath('/dashboard/contacts')
  return { success: true, company: company as Company }
 } catch (error) {
  console.error('Error creating company:', error)
  return { error: 'Erreur lors de la création' }
 }
}

// Update company
export async function updateCompany(id: string, formData: FormData) {
 const auth = await requirePermission('manage_contacts')
 if ('error' in auth) return { error: auth.error }
 const organizationId = auth.user.organizationId!

 const name = formData.get('name') as string
 const website = formData.get('website') as string | null
 const industry = formData.get('industry') as string | null
 const size = formData.get('size') as string | null
 const siret = formData.get('siret') as string | null
 const vatNumber = formData.get('vatNumber') as string | null
 const address = formData.get('address') as string | null
 const city = formData.get('city') as string | null
 const postalCode = formData.get('postalCode') as string | null
 const country = formData.get('country') as string | null

 if (!name) {
  return { error: 'Le nom est requis' }
 }

 try {
  const [company] = await db.update(companies)
   .set({
    name,
    website,
    industry,
    size,
    siret,
    vatNumber,
    address,
    city,
    postalCode,
    country,
    updatedAt: new Date(),
   })
   .where(and(
    eq(companies.id, id),
    eq(companies.organizationId, organizationId),
    isNull(companies.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/contacts')
  return { success: true, company: company as Company }
 } catch (error) {
  console.error('Error updating company:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// Soft delete company
export async function deleteCompany(id: string) {
 const auth = await requirePermission('manage_contacts')
 if ('error' in auth) return { error: auth.error }
 const organizationId = auth.user.organizationId!

 try {
  await db.update(companies)
   .set({ deletedAt: new Date() })
   .where(and(
    eq(companies.id, id),
    eq(companies.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/contacts')
  return { success: true }
 } catch (error) {
  console.error('Error deleting company:', error)
  return { error: 'Erreur lors de la suppression' }
 }
}

// Get all companies
export async function getCompanies(search?: string) {
 const organizationId = await getOrganizationId()

 try {
  const conditions = [
   eq(companies.organizationId, organizationId),
   isNull(companies.deletedAt)
  ]

  if (search) {
   conditions.push(
    or(
     ilike(companies.name, `%${search}%`),
     ilike(companies.city, `%${search}%`),
     ilike(companies.industry, `%${search}%`)
    )!
   )
  }

  const result = await db.select()
   .from(companies)
   .where(and(...conditions))
   .orderBy(companies.name)

  return { companies: result as Company[] }
 } catch (error) {
  console.error('Error fetching companies:', error)
  return { error: 'Erreur lors du chargement', companies: [] }
 }
}

// Get single company
export async function getCompany(id: string) {
 const organizationId = await getOrganizationId()

 try {
  const [company] = await db.select()
   .from(companies)
   .where(and(
    eq(companies.id, id),
    eq(companies.organizationId, organizationId),
    isNull(companies.deletedAt)
   ))

  return { company: company as Company }
 } catch (error) {
  console.error('Error fetching company:', error)
  return { error: 'Erreur lors du chargement' }
 }
}
