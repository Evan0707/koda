'use server'

import { db } from '@/db'
import { opportunities, pipelineStages } from '@/db/schema/crm'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { getOrganizationId, requirePermission } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for opportunity value
const MAX_VALUE_CENTS = 999_999_999_99 // ~10M
const opportunitySchema = z.object({
 name: z.string().min(1, 'Le nom est requis'),
 value: z.number().min(0).max(MAX_VALUE_CENTS, 'Valeur trop élevée'),
 stageId: z.string().min(1, 'L\'\u00e9tape est requise'),
 companyId: z.string().nullable().optional(),
 contactId: z.string().nullable().optional(),
 probability: z.number().min(0).max(100).default(50),
 expectedCloseDate: z.string().nullable().optional(),
})

// Get all opportunities with related data
export async function getOpportunities() {
 const organizationId = await getOrganizationId()
 const supabase = await createClient()

 try {
  const { data, error } = await supabase
   .from('opportunities')
   .select(`
        *,
        companies:company_id (id, name),
        contacts:contact_id (id, first_name, last_name),
        pipeline_stages:stage_id (id, name, color, is_won, is_lost)
      `)
   .eq('organization_id', organizationId)
   .is('deleted_at', null)
   .order('created_at', { ascending: false })

  if (error) throw error
  return { opportunities: data || [] }
 } catch (error) {
  console.error('Error fetching opportunities:', error)
  return { error: 'Erreur lors du chargement', opportunities: [] }
 }
}

// Create opportunity
export async function createOpportunity(formData: FormData) {
 const permResult = await requirePermission('manage_contacts')
 if ('error' in permResult) return permResult

 const organizationId = await getOrganizationId()
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 const name = formData.get('name') as string
 const value = parseInt(formData.get('value') as string || '0') * 100 // Convert to cents
 const stageId = formData.get('stageId') as string
 const companyId = formData.get('companyId') as string | null
 const contactId = formData.get('contactId') as string | null
 const probability = parseInt(formData.get('probability') as string || '50')
 const expectedCloseDate = formData.get('expectedCloseDate') as string | null

 if (!name) {
  return { error: 'Le nom est requis' }
 }

 if (!stageId) {
  return { error: 'L\'étape est requise' }
 }

 try {
  const [opportunity] = await db.insert(opportunities).values({
   organizationId,
   name,
   value,
   stageId,
   companyId: companyId || null,
   contactId: contactId || null,
   probability,
   expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
   ownerId: user?.id,
  }).returning()

  revalidatePath('/dashboard/pipeline')
  return { success: true, opportunity }
 } catch (error) {
  console.error('Error creating opportunity:', error)
  return { error: 'Erreur lors de la création' }
 }
}

// Update opportunity
export async function updateOpportunity(id: string, formData: FormData) {
 const permResult = await requirePermission('manage_contacts')
 if ('error' in permResult) return permResult

 const organizationId = await getOrganizationId()

 const name = formData.get('name') as string
 const value = parseInt(formData.get('value') as string || '0') * 100
 const stageId = formData.get('stageId') as string
 const companyId = formData.get('companyId') as string | null
 const contactId = formData.get('contactId') as string | null
 const probability = parseInt(formData.get('probability') as string || '50')
 const expectedCloseDate = formData.get('expectedCloseDate') as string | null

 if (!name) {
  return { error: 'Le nom est requis' }
 }

 try {
  const [opportunity] = await db.update(opportunities)
   .set({
    name,
    value,
    stageId,
    companyId: companyId || null,
    contactId: contactId || null,
    probability,
    expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
    updatedAt: new Date(),
   })
   .where(and(
    eq(opportunities.id, id),
    eq(opportunities.organizationId, organizationId),
    isNull(opportunities.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/pipeline')
  return { success: true, opportunity }
 } catch (error) {
  console.error('Error updating opportunity:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// Move opportunity to different stage (for drag & drop)
export async function moveOpportunityToStage(opportunityId: string, stageId: string) {
 const organizationId = await getOrganizationId()

 try {
  const [opportunity] = await db.update(opportunities)
   .set({
    stageId,
    updatedAt: new Date(),
   })
   .where(and(
    eq(opportunities.id, opportunityId),
    eq(opportunities.organizationId, organizationId),
    isNull(opportunities.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/pipeline')
  return { success: true, opportunity }
 } catch (error) {
  console.error('Error moving opportunity:', error)
  return { error: 'Erreur lors du déplacement' }
 }
}

// Soft delete opportunity
export async function deleteOpportunity(id: string) {
 const permResult = await requirePermission('manage_contacts')
 if ('error' in permResult) return permResult

 const organizationId = await getOrganizationId()

 try {
  await db.update(opportunities)
   .set({ deletedAt: new Date() })
   .where(and(
    eq(opportunities.id, id),
    eq(opportunities.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/pipeline')
  return { success: true }
 } catch (error) {
  console.error('Error deleting opportunity:', error)
  return { error: 'Erreur lors de la suppression' }
 }
}

// Close opportunity as won
export async function closeOpportunityWon(id: string) {
 const organizationId = await getOrganizationId()

 try {
  // Find the 'won' stage for this org
  const wonStage = await db.query.pipelineStages.findFirst({
   where: and(
    eq(pipelineStages.organizationId, organizationId),
    eq(pipelineStages.isWon, true)
   )
  })

  const [opportunity] = await db.update(opportunities)
   .set({
    closedAt: new Date(),
    probability: 100,
    ...(wonStage ? { stageId: wonStage.id } : {}),
    updatedAt: new Date(),
   })
   .where(and(
    eq(opportunities.id, id),
    eq(opportunities.organizationId, organizationId),
    isNull(opportunities.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/pipeline')
  return { success: true, opportunity }
 } catch (error) {
  console.error('Error closing opportunity:', error)
  return { error: 'Erreur lors de la clôture' }
 }
}

// Close opportunity as lost
export async function closeOpportunityLost(id: string, reason?: string) {
 const organizationId = await getOrganizationId()

 try {
  // Find the 'lost' stage for this org
  const lostStage = await db.query.pipelineStages.findFirst({
   where: and(
    eq(pipelineStages.organizationId, organizationId),
    eq(pipelineStages.isLost, true)
   )
  })

  const [opportunity] = await db.update(opportunities)
   .set({
    closedAt: new Date(),
    lostReason: reason || null,
    probability: 0,
    ...(lostStage ? { stageId: lostStage.id } : {}),
    updatedAt: new Date(),
   })
   .where(and(
    eq(opportunities.id, id),
    eq(opportunities.organizationId, organizationId),
    isNull(opportunities.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/pipeline')
  return { success: true, opportunity }
 } catch (error) {
  console.error('Error closing opportunity:', error)
  return { error: 'Erreur lors de la clôture' }
 }
}
