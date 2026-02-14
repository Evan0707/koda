'use server'

import { db } from '@/db'
import { products } from '@/db/schema/billing'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const productSchema = z.object({
 name: z.string().min(1, 'Le nom est requis'),
 description: z.string().optional(),
 unitPrice: z.coerce.number().min(0, 'Le prix doit être positif'),
 currency: z.string().default('EUR'),
 unit: z.string().default('unit'),
 vatRate: z.coerce.number().min(0).max(100).default(20),
 isActive: z.boolean().default(true),
})

export async function getProducts(query?: string) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [eq(products.organizationId, organizationId)]
  if (query) {
   conditions.push(ilike(products.name, `%${query}%`))
  }

  const data = await db.select()
   .from(products)
   .where(and(...conditions))
   .orderBy(desc(products.createdAt))

  return { products: data }
 } catch (error) {
  console.error('Error fetching products:', error)
  return { error: 'Erreur lors de la récupération des produits' }
 }
}

export async function createProduct(formData: FormData) {
 try {
  const auth = await requirePermission('manage_products')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  const rawData = {
   name: formData.get('name'),
   description: formData.get('description'),
   unitPrice: formData.get('unitPrice'),
   currency: formData.get('currency') || 'EUR',
   unit: formData.get('unit') || 'unit',
   vatRate: formData.get('vatRate') || 20,
  }

  const validated = productSchema.parse(rawData)

  // Convert price to cents
  const priceInCents = Math.round(validated.unitPrice * 100)

  await db.insert(products).values({
   organizationId,
   name: validated.name,
   description: validated.description,
   unitPrice: priceInCents,
   currency: validated.currency,
   unit: validated.unit,
   vatRate: validated.vatRate,
   isActive: true, // Default to active
  })

  revalidatePath('/dashboard/products')
  return { success: true }
 } catch (error) {
  console.error('Error creating product:', error)
  return { error: 'Erreur lors de la création du produit' }
 }
}

export async function updateProduct(id: string, formData: FormData) {
 try {
  const auth = await requirePermission('manage_products')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  const rawData = {
   name: formData.get('name'),
   description: formData.get('description'),
   unitPrice: formData.get('unitPrice'),
   currency: formData.get('currency'),
   unit: formData.get('unit'),
   vatRate: formData.get('vatRate'),
  }

  const validated = productSchema.parse(rawData)
  const priceInCents = Math.round(validated.unitPrice * 100)

  await db.update(products)
   .set({
    name: validated.name,
    description: validated.description,
    unitPrice: priceInCents,
    currency: validated.currency,
    unit: validated.unit,
    vatRate: validated.vatRate,
    updatedAt: new Date(),
   })
   .where(and(
    eq(products.id, id),
    eq(products.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/products')
  return { success: true }
 } catch (error) {
  console.error('Error updating product:', error)
  return { error: 'Erreur lors de la modification du produit' }
 }
}

export async function deleteProduct(id: string) {
 try {
  const auth = await requirePermission('manage_products')
  if ('error' in auth) return { error: auth.error }
  const organizationId = auth.user.organizationId!

  // Usually we would soft delete or checking usage, but for now hard delete
  await db.delete(products)
   .where(and(
    eq(products.id, id),
    eq(products.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/products')
  return { success: true }
 } catch (error) {
  console.error('Error deleting product:', error)
  return { error: 'Erreur lors de la suppression' }
 }
}
