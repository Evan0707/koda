'use server'

import { db } from '@/db'
import { tags, taggables } from '@/db/schema/crm'
import { getOrganizationId, requirePermission } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq, and, asc } from 'drizzle-orm'

export async function getTags() {
 try {
  const organizationId = await getOrganizationId()

  const allTags = await db.select()
   .from(tags)
   .where(eq(tags.organizationId, organizationId))
   .orderBy(asc(tags.name))

  return { tags: allTags }
 } catch (error) {
  console.error('Error fetching tags:', error)
  return { error: 'Erreur lors du chargement des tags' }
 }
}

export async function createTag(name: string, color: string = '#6366F1') {
 try {
  const permResult = await requirePermission('manage_contacts')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  const [tag] = await db.insert(tags).values({
   organizationId,
   name,
   color,
  }).returning()

  revalidatePath('/dashboard/contacts')
  return { success: true, tag }
 } catch (error) {
  console.error('Error creating tag:', error)
  return { error: 'Erreur lors de la création du tag' }
 }
}

export async function deleteTag(id: string) {
 try {
  const organizationId = await getOrganizationId()

  // Verify the tag belongs to this org FIRST, then delete in a transaction
  await db.transaction(async (tx) => {
   const tag = await tx.select().from(tags).where(and(
    eq(tags.id, id),
    eq(tags.organizationId, organizationId)
   ))
   if (tag.length === 0) throw new Error('Tag introuvable')

   // Delete relations first
   await tx.delete(taggables).where(eq(taggables.tagId, id))
   await tx.delete(tags).where(eq(tags.id, id))
  })

  revalidatePath('/dashboard/contacts')
  return { success: true }
 } catch (error) {
  console.error('Error deleting tag:', error)
  return { error: 'Erreur lors de la suppression' }
 }
}

export async function assignTag(tagId: string, entityId: string, entityType: string) {
 try {
  // Check if assignments already exists
  const existing = await db.select()
   .from(taggables)
   .where(and(
    eq(taggables.tagId, tagId),
    eq(taggables.taggableId, entityId),
    eq(taggables.taggableType, entityType)
   ))

  if (existing.length > 0) return { success: true }

  await db.insert(taggables).values({
   tagId,
   taggableId: entityId,
   taggableType: entityType,
  })

  revalidatePath('/dashboard/contacts')
  return { success: true }
 } catch (error) {
  console.error('Error assigning tag:', error)
  return { error: "Erreur lors de l'attribution du tag" }
 }
}

export async function removeTag(tagId: string, entityId: string, entityType: string) {
 try {
  await db.delete(taggables)
   .where(and(
    eq(taggables.tagId, tagId),
    eq(taggables.taggableId, entityId),
    eq(taggables.taggableType, entityType)
   ))

  revalidatePath('/dashboard/contacts')
  return { success: true }
 } catch (error) {
  console.error('Error removing tag:', error)
  return { error: 'Erreur lors du retrait du tag' }
 }
}
