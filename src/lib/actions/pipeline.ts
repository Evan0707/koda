'use server'

import { db } from '@/db'
import { pipelineStages } from '@/db/schema/crm'

import { getOrganizationId, requirePermission } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq, and, asc } from 'drizzle-orm'

// Get all stages ordered by position
export async function getPipelineStages() {
  const organizationId = await getOrganizationId()

  try {
    const stages = await db.select()
      .from(pipelineStages)
      .where(eq(pipelineStages.organizationId, organizationId))
      .orderBy(asc(pipelineStages.position))

    return { stages }
  } catch (error) {
    console.error('Error fetching stages:', error)
    return { error: 'Erreur lors du chargement', stages: [] }
  }
}

// Create default stages for new organization
export async function createDefaultStages() {
  const organizationId = await getOrganizationId()

  // Use a transaction with check to avoid race conditions
  try {
    const stages = await db.transaction(async (tx) => {
      const existing = await tx.select()
        .from(pipelineStages)
        .where(eq(pipelineStages.organizationId, organizationId))

      if (existing.length > 0) return existing

      const defaultStages = [
        { name: 'Lead', color: '#6B7280', position: 0, isWon: false, isLost: false },
        { name: 'Qualification', color: '#3B82F6', position: 1, isWon: false, isLost: false },
        { name: 'Proposition', color: '#8B5CF6', position: 2, isWon: false, isLost: false },
        { name: 'Négociation', color: '#F59E0B', position: 3, isWon: false, isLost: false },
        { name: 'Gagné', color: '#10B981', position: 4, isWon: true, isLost: false },
        { name: 'Perdu', color: '#EF4444', position: 5, isWon: false, isLost: true },
      ]

      return await tx.insert(pipelineStages)
        .values(defaultStages.map(stage => ({
          organizationId,
          ...stage,
        })))
        .returning()
    })

    revalidatePath('/dashboard/pipeline')
    return { success: true, stages }
  } catch (error) {
    console.error('Error creating default stages:', error)
    return { error: 'Erreur lors de la création' }
  }
}

// Create stage
export async function createStage(formData: FormData) {
  const permResult = await requirePermission('manage_pipeline')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  const name = formData.get('name') as string
  const color = formData.get('color') as string || '#6366F1'

  if (!name) {
    return { error: 'Le nom est requis' }
  }

  try {
    // Get max position
    const existing = await db.select()
      .from(pipelineStages)
      .where(eq(pipelineStages.organizationId, organizationId))
      .orderBy(asc(pipelineStages.position))

    const maxPosition = existing.length > 0
      ? Math.max(...existing.map(s => s.position)) + 1
      : 0

    const [stage] = await db.insert(pipelineStages).values({
      organizationId,
      name,
      color,
      position: maxPosition,
    }).returning()

    revalidatePath('/dashboard/pipeline')
    return { success: true, stage }
  } catch (error) {
    console.error('Error creating stage:', error)
    return { error: 'Erreur lors de la création' }
  }
}

// Update stage
export async function updateStage(id: string, formData: FormData) {
  const permResult = await requirePermission('manage_pipeline')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  const name = formData.get('name') as string
  const color = formData.get('color') as string

  if (!name) {
    return { error: 'Le nom est requis' }
  }

  try {
    const [stage] = await db.update(pipelineStages)
      .set({ name, color })
      .where(and(
        eq(pipelineStages.id, id),
        eq(pipelineStages.organizationId, organizationId)
      ))
      .returning()

    revalidatePath('/dashboard/pipeline')
    return { success: true, stage }
  } catch (error) {
    console.error('Error updating stage:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }
}

// Delete stage
export async function deleteStage(id: string) {
  const permResult = await requirePermission('manage_pipeline')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  try {
    await db.delete(pipelineStages)
      .where(and(
        eq(pipelineStages.id, id),
        eq(pipelineStages.organizationId, organizationId)
      ))

    revalidatePath('/dashboard/pipeline')
    return { success: true }
  } catch (error) {
    console.error('Error deleting stage:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// Reorder stages
export async function reorderStages(stageIds: string[]) {
  const organizationId = await getOrganizationId()

  try {
    // Update positions atomically in a transaction
    await db.transaction(async (tx) => {
      for (let index = 0; index < stageIds.length; index++) {
        await tx.update(pipelineStages)
          .set({ position: index })
          .where(and(
            eq(pipelineStages.id, stageIds[index]),
            eq(pipelineStages.organizationId, organizationId)
          ))
      }
    })

    revalidatePath('/dashboard/pipeline')
    return { success: true }
  } catch (error) {
    console.error('Error reordering stages:', error)
    return { error: 'Erreur lors du réordonnancement' }
  }
}
