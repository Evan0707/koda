'use server'

import { db } from '@/db'
import { tasks } from '@/db/schema/projects'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { Task, User } from '@/types/db'
import { and, asc, desc, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema
const taskSchema = z.object({
 title: z.string().min(1, 'Le titre est requis'),
 description: z.string().optional(),
 projectId: z.string().min(1, 'Le projet est requis'),
 cycleId: z.string().nullable().optional(),
 assigneeId: z.string().nullable().optional(),
 status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
 priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
 estimatedHours: z.coerce.number().optional(),
 dueDate: z.string().optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

// Task with assignee info
export type TaskWithAssignee = Task & {
 assignee: { id: string; firstName: string | null; lastName: string | null } | null
}

// Get tasks by project
export async function getTasks(projectId: string) {
 try {
  const organizationId = await getOrganizationId()

  const data = await db.query.tasks.findMany({
   where: and(
    eq(tasks.organizationId, organizationId),
    eq(tasks.projectId, projectId),
    isNull(tasks.deletedAt)
   ),
   with: {
    assignee: {
     columns: {
      id: true,
      firstName: true,
      lastName: true,
     }
    }
   },
   orderBy: [asc(tasks.position), desc(tasks.createdAt)],
  })

  return { tasks: data as TaskWithAssignee[] }
 } catch (error) {
  console.error('Error fetching tasks:', error)
  return { error: 'Erreur lors de la récupération des tâches' }
 }
}

// Get tasks grouped by status (for Kanban)
export async function getTasksByStatus(projectId: string) {
 try {
  const result = await getTasks(projectId)
  if (result.error) return result

  const grouped = {
   todo: result.tasks?.filter(t => t.status === 'todo') || [],
   in_progress: result.tasks?.filter(t => t.status === 'in_progress') || [],
   review: result.tasks?.filter(t => t.status === 'review') || [],
   done: result.tasks?.filter(t => t.status === 'done') || [],
  }

  return { tasks: grouped }
 } catch (error) {
  console.error('Error fetching tasks by status:', error)
  return { error: 'Erreur lors de la récupération des tâches' }
 }
}

// Get single task
export async function getTask(id: string) {
 try {
  const organizationId = await getOrganizationId()

  const task = await db.query.tasks.findFirst({
   where: and(
    eq(tasks.id, id),
    eq(tasks.organizationId, organizationId),
    isNull(tasks.deletedAt)
   ),
   with: {
    assignee: true,
    project: true,
   }
  })

  if (!task) return { error: 'Tâche non trouvée' }
  return { task }
 } catch (error) {
  console.error('Error fetching task:', error)
  return { error: 'Erreur lors de la récupération de la tâche' }
 }
}

// Create task
export async function createTask(data: TaskFormData) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()
  const user = await getUser()
  const validated = taskSchema.parse(data)

  // Get max position for this project
  const existingTasks = await db.query.tasks.findMany({
   where: and(
    eq(tasks.projectId, validated.projectId),
    eq(tasks.status, validated.status),
    isNull(tasks.deletedAt)
   ),
   columns: { position: true },
   orderBy: [desc(tasks.position)],
   limit: 1,
  })

  const maxPosition = existingTasks[0]?.position ?? -1

  const [task] = await db.insert(tasks).values({
   organizationId,
   createdById: user?.id,
   projectId: validated.projectId,
   cycleId: validated.cycleId || null,
   assigneeId: validated.assigneeId || null,
   title: validated.title,
   description: validated.description,
   status: validated.status,
   priority: validated.priority,
   estimatedHours: validated.estimatedHours,
   dueDate: validated.dueDate || null,
   position: maxPosition + 1,
  }).returning()

  revalidatePath(`/dashboard/projects/${validated.projectId}`)
  return { success: true, task: task as Task }
 } catch (error) {
  console.error('Error creating task:', error)
  if (error instanceof z.ZodError) {
   return { error: error.issues[0].message }
  }
  return { error: 'Erreur lors de la création de la tâche' }
 }
}

// Update task
export async function updateTask(id: string, data: Partial<TaskFormData>) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  // Validate partial data through Zod
  const validated = taskSchema.partial().safeParse(data)
  if (!validated.success) {
   return { error: validated.error.issues[0].message }
  }
  const safeData = validated.data

  const [task] = await db.update(tasks)
   .set({
    ...safeData,
    assigneeId: safeData.assigneeId || null,
    cycleId: safeData.cycleId || null,
    dueDate: safeData.dueDate || null,
    updatedAt: new Date(),
   })
   .where(and(
    eq(tasks.id, id),
    eq(tasks.organizationId, organizationId),
    isNull(tasks.deletedAt)
   ))
   .returning()

  if (task?.projectId) {
   revalidatePath(`/dashboard/projects/${task.projectId}`)
  }
  return { success: true, task: task as Task }
 } catch (error) {
  console.error('Error updating task:', error)
  return { error: 'Erreur lors de la mise à jour de la tâche' }
 }
}

// Valid task statuses
const VALID_TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const

// Update task status (for drag & drop)
export async function updateTaskStatus(id: string, status: string, newPosition?: number) {
 try {
  if (!VALID_TASK_STATUSES.includes(status as any)) {
   return { error: `Statut invalide. Valeurs autorisées : ${VALID_TASK_STATUSES.join(', ')}` }
  }

  const organizationId = await getOrganizationId()

  const updateData: any = {
   status,
   updatedAt: new Date(),
  }

  if (status === 'done') {
   updateData.completedAt = new Date()
  }

  if (newPosition !== undefined) {
   updateData.position = newPosition
  }

  const [task] = await db.update(tasks)
   .set(updateData)
   .where(and(
    eq(tasks.id, id),
    eq(tasks.organizationId, organizationId)
   ))
   .returning()

  if (task?.projectId) {
   revalidatePath(`/dashboard/projects/${task.projectId}`)
  }
  return { success: true }
 } catch (error) {
  console.error('Error updating task status:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// Reorder tasks (bulk update positions)
export async function reorderTasks(taskUpdates: { id: string; position: number; status: string }[]) {
 try {
  const organizationId = await getOrganizationId()

  await db.transaction(async (tx) => {
   for (const update of taskUpdates) {
    await tx.update(tasks)
     .set({
      position: update.position,
      status: update.status,
      updatedAt: new Date(),
      completedAt: update.status === 'done' ? new Date() : undefined,
     })
     .where(and(
      eq(tasks.id, update.id),
      eq(tasks.organizationId, organizationId)
     ))
   }
  })

  return { success: true }
 } catch (error) {
  console.error('Error reordering tasks:', error)
  return { error: 'Erreur lors de la réorganisation' }
 }
}

// Delete task (soft delete)
export async function deleteTask(id: string) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  const [task] = await db.update(tasks)
   .set({ deletedAt: new Date() })
   .where(and(
    eq(tasks.id, id),
    eq(tasks.organizationId, organizationId)
   ))
   .returning()

  if (task?.projectId) {
   revalidatePath(`/dashboard/projects/${task.projectId}`)
  }
  return { success: true }
 } catch (error) {
  console.error('Error deleting task:', error)
  return { error: 'Erreur lors de la suppression de la tâche' }
 }
}
