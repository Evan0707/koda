'use server'

import { db } from '@/db'
import { timeEntries, tasks, projects } from '@/db/schema/projects'
import { getOrganizationId, getUser } from '@/lib/auth'
import { TimeEntry, Task, Project } from '@/types/db'
import { and, desc, eq, isNull, gte, lte, sql, sum } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema
const timeEntrySchema = z.object({
 projectId: z.string().min(1, 'Le projet est requis'),
 taskId: z.string().nullable().optional(),
 description: z.string().optional(),
 duration: z.coerce.number().min(1, 'La durée est requise'), // in minutes
 date: z.string(),
 isBillable: z.boolean().default(true),
 hourlyRate: z.coerce.number().optional(),
})

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>

// Time entry with relations
export type TimeEntryWithRelations = TimeEntry & {
 project: { id: string; name: string } | null
 task: { id: string; title: string } | null
}

// Get time entries for current user
export async function getTimeEntries(options?: {
 projectId?: string
 startDate?: string
 endDate?: string
}) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  const conditions = [
   eq(timeEntries.organizationId, organizationId),
   eq(timeEntries.userId, user!.id),
  ]

  if (options?.projectId) {
   conditions.push(eq(timeEntries.projectId, options.projectId))
  }

  if (options?.startDate) {
   conditions.push(gte(timeEntries.date, options.startDate))
  }

  if (options?.endDate) {
   conditions.push(lte(timeEntries.date, options.endDate))
  }

  const data = await db.query.timeEntries.findMany({
   where: and(...conditions),
   with: {
    project: {
     columns: { id: true, name: true }
    },
    task: {
     columns: { id: true, title: true }
    }
   },
   orderBy: [desc(timeEntries.date), desc(timeEntries.createdAt)],
  })

  return { entries: data as TimeEntryWithRelations[] }
 } catch (error) {
  console.error('Error fetching time entries:', error)
  return { error: 'Erreur lors de la récupération des entrées' }
 }
}

// Get time entries grouped by date
export async function getTimeEntriesByDate(startDate: string, endDate: string) {
 try {
  const result = await getTimeEntries({ startDate, endDate })
  if (result.error) return result

  // Group by date
  const grouped: Record<string, TimeEntryWithRelations[]> = {}

  for (const entry of result.entries || []) {
   const dateKey = entry.date
   if (!grouped[dateKey]) grouped[dateKey] = []
   grouped[dateKey].push(entry)
  }

  return { entries: grouped }
 } catch (error) {
  console.error('Error fetching grouped entries:', error)
  return { error: 'Erreur' }
 }
}

// Get time summary (for dashboard)
export async function getTimeSummary() {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  // This week
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Today
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const [weekResult] = await db
   .select({ total: sum(timeEntries.duration) })
   .from(timeEntries)
   .where(and(
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id),
    gte(timeEntries.date, startOfWeek.toISOString().split('T')[0]),
    lte(timeEntries.date, endOfWeek.toISOString().split('T')[0])
   ))

  const [todayResult] = await db
   .select({ total: sum(timeEntries.duration) })
   .from(timeEntries)
   .where(and(
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id),
    eq(timeEntries.date, startOfDay.toISOString().split('T')[0])
   ))

  return {
   today: Number(todayResult?.total || 0),
   week: Number(weekResult?.total || 0),
  }
 } catch (error) {
  console.error('Error fetching time summary:', error)
  return { error: 'Erreur' }
 }
}

// Create time entry
export async function createTimeEntry(data: TimeEntryFormData) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()
  const validated = timeEntrySchema.parse(data)

  const [entry] = await db.insert(timeEntries).values({
   organizationId,
   userId: user!.id,
   projectId: validated.projectId,
   taskId: validated.taskId || null,
   description: validated.description,
   duration: validated.duration,
   date: validated.date,
   isBillable: validated.isBillable,
   hourlyRate: validated.hourlyRate,
  }).returning()

  revalidatePath('/dashboard/time')
  return { success: true, entry: entry as TimeEntry }
 } catch (error) {
  console.error('Error creating time entry:', error)
  if (error instanceof z.ZodError) {
   return { error: error.issues[0].message }
  }
  return { error: 'Erreur lors de la création' }
 }
}

// Update time entry
export async function updateTimeEntry(id: string, data: Partial<TimeEntryFormData>) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  const [entry] = await db.update(timeEntries)
   .set({
    ...data,
    taskId: data.taskId || null,
    updatedAt: new Date(),
   })
   .where(and(
    eq(timeEntries.id, id),
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id)
   ))
   .returning()

  revalidatePath('/dashboard/time')
  return { success: true, entry: entry as TimeEntry }
 } catch (error) {
  console.error('Error updating time entry:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// Delete time entry
export async function deleteTimeEntry(id: string) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  await db.delete(timeEntries)
   .where(and(
    eq(timeEntries.id, id),
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id)
   ))

  revalidatePath('/dashboard/time')
  return { success: true }
 } catch (error) {
  console.error('Error deleting time entry:', error)
  return { error: 'Erreur lors de la suppression' }
 }
}

// Start timer (create entry with startedAt)
export async function startTimer(projectId: string, taskId?: string, description?: string) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  const [entry] = await db.insert(timeEntries).values({
   organizationId,
   userId: user!.id,
   projectId,
   taskId: taskId || null,
   description,
   duration: 0,
   date: new Date().toISOString().split('T')[0],
   startedAt: new Date(),
   isBillable: true,
  }).returning()

  revalidatePath('/dashboard/time')
  return { success: true, entry: entry as TimeEntry }
 } catch (error) {
  console.error('Error starting timer:', error)
  return { error: 'Erreur lors du démarrage' }
 }
}

// Stop timer (update duration based on elapsed time)
export async function stopTimer(id: string) {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  // Get the entry to calculate duration
  const entry = await db.query.timeEntries.findFirst({
   where: and(
    eq(timeEntries.id, id),
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id)
   )
  })

  if (!entry || !entry.startedAt) {
   return { error: 'Timer non trouvé' }
  }

  const startTime = new Date(entry.startedAt).getTime()
  const endTime = Date.now()
  const durationMinutes = Math.round((endTime - startTime) / 60000)

  const [updated] = await db.update(timeEntries)
   .set({
    duration: durationMinutes,
    endedAt: new Date(),
    updatedAt: new Date(),
   })
   .where(eq(timeEntries.id, id))
   .returning()

  revalidatePath('/dashboard/time')
  return { success: true, entry: updated as TimeEntry }
 } catch (error) {
  console.error('Error stopping timer:', error)
  return { error: 'Erreur lors de l\'arrêt' }
 }
}

// Get active timer
export async function getActiveTimer() {
 try {
  const organizationId = await getOrganizationId()
  const user = await getUser()

  const entry = await db.query.timeEntries.findFirst({
   where: and(
    eq(timeEntries.organizationId, organizationId),
    eq(timeEntries.userId, user!.id),
    sql`${timeEntries.startedAt} IS NOT NULL`,
    isNull(timeEntries.endedAt)
   ),
   with: {
    project: { columns: { id: true, name: true } },
    task: { columns: { id: true, title: true } }
   }
  })

  return { timer: entry as TimeEntryWithRelations | null }
 } catch (error) {
  console.error('Error fetching active timer:', error)
  return { error: 'Erreur' }
 }
}
