import { getProjectHubData } from '@/lib/actions/project-hub'
import { getTasksByStatus } from '@/lib/actions/tasks'
import { notFound } from 'next/navigation'
import ProjectDetailClient from '@/app/(dashboard)/dashboard/projects/[id]/project-detail-client'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { project, summary, error } = await getProjectHubData(id)

 if (error || !project) {
  notFound()
 }

 const { tasks } = await getTasksByStatus(id)

 return (
  <ProjectDetailClient
   project={project}
   initialTasks={tasks || { todo: [], in_progress: [], review: [], done: [] }}
   summary={summary!}
  />
 )
}
