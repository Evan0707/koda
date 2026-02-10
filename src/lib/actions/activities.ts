'use server'

import { db } from '@/db'
import { activities } from '@/db/schema/crm'
import { users } from '@/db/schema/core'
import { getOrganizationId } from '@/lib/auth'
import { getUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'

const activitySchema = z.object({
 type: z.enum(['note', 'call', 'email', 'meeting', 'task']),
 content: z.string().min(1, 'Le contenu est requis'),
 contactId: z.string().optional(),
 companyId: z.string().optional(),
 opportunityId: z.string().optional(),
 performedAt: z.string().optional(),
})

export async function createActivity(formData: FormData) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  if (!user) return { error: 'Non autorisé' }

  const rawData = {
   type: formData.get('type'),
   content: formData.get('content'),
   contactId: formData.get('contactId') || undefined,
   companyId: formData.get('companyId') || undefined,
   opportunityId: formData.get('opportunityId') || undefined,
   performedAt: formData.get('performedAt') || new Date().toISOString(),
  }

  const validated = activitySchema.parse(rawData)

  await db.insert(activities).values({
   organizationId,
   createdBy: user.id,
   type: validated.type,
   content: validated.content,
   contactId: validated.contactId,
   companyId: validated.companyId,
   opportunityId: validated.opportunityId,
   performedAt: validated.performedAt ? new Date(validated.performedAt) : new Date(),
  })

  if (validated.contactId) revalidatePath(`/dashboard/contacts/${validated.contactId}`)
  if (validated.companyId) revalidatePath(`/dashboard/companies/${validated.companyId}`)

  return { success: true }
 } catch (error) {
  console.error('Error creating activity:', error)
  return { error: 'Erreur lors de la création' }
 }
}

export async function getActivities(entityType: 'contact' | 'company' | 'opportunity', entityId: string) {
 try {
  const organizationId = await getOrganizationId()

  let whereClause
  if (entityType === 'contact') whereClause = eq(activities.contactId, entityId)
  else if (entityType === 'company') whereClause = eq(activities.companyId, entityId)
  else if (entityType === 'opportunity') whereClause = eq(activities.opportunityId, entityId)
  else return { error: 'Type d\'entité invalide' }

  const data = await db.select({
   id: activities.id,
   type: activities.type,
   content: activities.content,
   performedAt: activities.performedAt,
   creator: {
    first_name: users.firstName,
    last_name: users.lastName,
    avatar_url: users.avatarUrl,
   }
  })
   .from(activities)
   .leftJoin(users, eq(activities.createdBy, users.id))
   .where(and(
    eq(activities.organizationId, organizationId),
    whereClause
   ))
   .orderBy(desc(activities.performedAt))

  return { activities: data }
 } catch (error) {
  console.error('Error fetching activities:', error)
  return { error: 'Erreur lors de la récupération' }
 }
}
