import { getProject } from '@/lib/actions/projects'
import { getTasksByStatus } from '@/lib/actions/tasks'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/app/(dashboard)/dashboard/projects/[id]/project-detail-client'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { project, error } = await getProject(id)

 if (error || !project) {
  notFound()
 }

 const { tasks } = await getTasksByStatus(id)

 return (
  <ProjectDetailClient
   project={project}
   initialTasks={tasks || { todo: [], in_progress: [], review: [], done: [] }}
  />
 )
}
