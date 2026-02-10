import { getProjects } from '@/lib/actions/projects'
import ProjectsClient from './projects-client'

export default async function ProjectsPage() {
 const { projects, error } = await getProjects()

 return <ProjectsClient initialProjects={projects || []} />
}
