'use server'

import { db } from '@/db'
import { projects } from '@/db/schema/projects'
import { getOrganizationId, getUser, requirePermission } from '@/lib/auth'
import { Project, ProjectWithDetails, Company, Contact, Quote } from '@/types/db'
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema
const projectSchema = z.object({
 name: z.string().min(1, 'Le nom est requis'),
 description: z.string().optional(),
 companyId: z.string().nullable().optional(),
 contactId: z.string().nullable().optional(),
 quoteId: z.string().nullable().optional(),
 managerId: z.string().nullable().optional(),
 status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
 budgetType: z.enum(['fixed', 'hourly', 'retainer']).default('fixed'),
 budgetAmount: z.coerce.number().optional(),
 budgetHours: z.coerce.number().optional(),
 startDate: z.string().optional(),
 endDate: z.string().optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>

// Get all projects
export async function getProjects(query?: string, status?: string) {
 try {
  const organizationId = await getOrganizationId()

  const conditions = [
   eq(projects.organizationId, organizationId),
   isNull(projects.deletedAt)
  ]

  if (query) {
   conditions.push(
    or(
     ilike(projects.name, `%${query}%`),
     ilike(projects.description, `%${query}%`)
    )!
   )
  }

  if (status && status !== 'all') {
   conditions.push(eq(projects.status, status))
  }

  const data = await db.query.projects.findMany({
   where: and(...conditions),
   with: {
    company: true,
    owner: true,
    manager: true,
   },
   orderBy: [desc(projects.createdAt)],
  })

  return { projects: data as (Project & { company: Company | null; owner: { id: string; firstName: string | null; lastName: string | null } | null; manager: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null })[] }
 } catch (error) {
  console.error('Error fetching projects:', error)
  return { error: 'Erreur lors de la récupération des projets' }
 }
}

// Get single project with details
export async function getProject(id: string) {
 try {
  const organizationId = await getOrganizationId()

  const project = await db.query.projects.findFirst({
   where: and(
    eq(projects.id, id),
    eq(projects.organizationId, organizationId),
    isNull(projects.deletedAt)
   ),
   with: {
    company: true,
    quote: true,
    owner: true,
    manager: true,
    tasks: {
     where: (tasks, { isNull }) => isNull(tasks.deletedAt),
     orderBy: (tasks, { asc }) => [asc(tasks.position)]
    }
   }
  })

  if (!project) return { error: 'Projet non trouvé' }
  return { project }
 } catch (error) {
  console.error('Error fetching project:', error)
  return { error: 'Erreur lors de la récupération du projet' }
 }
}

// Create project
export async function createProject(data: ProjectFormData) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  // Check project limit
  const { checkProjectLimit } = await import('./plan-limits')
  const limitCheck = await checkProjectLimit()
  if (!limitCheck.canCreate) {
   return { error: limitCheck.error }
  }

  const organizationId = await getOrganizationId()
  const user = await getUser()
  const validated = projectSchema.parse(data)

  const [project] = await db.insert(projects).values({
   organizationId,
   ownerId: user?.id,
   name: validated.name,
   description: validated.description,
   companyId: validated.companyId || null,
   contactId: validated.contactId || null,
   quoteId: validated.quoteId || null,
   managerId: validated.managerId || null,
   status: validated.status,
   budgetType: validated.budgetType,
   budgetAmount: validated.budgetAmount ? Math.round(validated.budgetAmount * 100) : null,
   budgetHours: validated.budgetHours,
   startDate: validated.startDate || null,
   endDate: validated.endDate || null,
  }).returning()

  revalidatePath('/dashboard/projects')
  return { success: true, project: project as Project }
 } catch (error) {
  console.error('Error creating project:', error)
  if (error instanceof z.ZodError) {
   return { error: error.issues[0].message }
  }
  return { error: 'Erreur lors de la création du projet' }
 }
}

// Update project
export async function updateProject(id: string, data: ProjectFormData) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()
  const validated = projectSchema.parse(data)

  const [project] = await db.update(projects)
   .set({
    name: validated.name,
    description: validated.description,
    companyId: validated.companyId || null,
    contactId: validated.contactId || null,
    quoteId: validated.quoteId || null,
    managerId: validated.managerId || null,
    status: validated.status,
    budgetType: validated.budgetType,
    budgetAmount: validated.budgetAmount ? Math.round(validated.budgetAmount * 100) : null,
    budgetHours: validated.budgetHours,
    startDate: validated.startDate || null,
    endDate: validated.endDate || null,
    updatedAt: new Date(),
   })
   .where(and(
    eq(projects.id, id),
    eq(projects.organizationId, organizationId),
    isNull(projects.deletedAt)
   ))
   .returning()

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  return { success: true, project: project as Project }
 } catch (error) {
  console.error('Error updating project:', error)
  if (error instanceof z.ZodError) {
   return { error: error.issues[0].message }
  }
  return { error: 'Erreur lors de la mise à jour du projet' }
 }
}

// Valid project statuses
const VALID_PROJECT_STATUSES = ['active', 'paused', 'completed', 'cancelled'] as const

// Update project status
export async function updateProjectStatus(id: string, status: string) {
 try {
  if (!VALID_PROJECT_STATUSES.includes(status as any)) {
   return { error: `Statut invalide. Valeurs autorisées : ${VALID_PROJECT_STATUSES.join(', ')}` }
  }

  const organizationId = await getOrganizationId()

  await db.update(projects)
   .set({
    status,
    updatedAt: new Date(),
   })
   .where(and(
    eq(projects.id, id),
    eq(projects.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${id}`)
  return { success: true }
 } catch (error) {
  console.error('Error updating project status:', error)
  return { error: 'Erreur lors de la mise à jour' }
 }
}

// Delete project (soft delete)
export async function deleteProject(id: string) {
 try {
  const permResult = await requirePermission('manage_projects')
  if ('error' in permResult) return permResult

  const organizationId = await getOrganizationId()

  await db.update(projects)
   .set({ deletedAt: new Date() })
   .where(and(
    eq(projects.id, id),
    eq(projects.organizationId, organizationId)
   ))

  revalidatePath('/dashboard/projects')
  return { success: true }
 } catch (error) {
  console.error('Error deleting project:', error)
  return { error: 'Erreur lors de la suppression du projet' }
 }
}
