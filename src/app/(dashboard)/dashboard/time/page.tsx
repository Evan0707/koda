import { getTimeEntries, getTimeSummary, getActiveTimer } from '@/lib/actions/time-entries'
import { getProjects } from '@/lib/actions/projects'
import TimeTrackingClient from './time-client'

export default async function TimePage() {
 const [entriesRes, summaryRes, timerRes, projectsRes] = await Promise.all([
  getTimeEntries(),
  getTimeSummary(),
  getActiveTimer(),
  getProjects(),
 ])

 return (
  <TimeTrackingClient
   initialEntries={'error' in entriesRes ? [] : entriesRes.entries || []}
   summary={'error' in summaryRes ? { today: 0, week: 0 } : summaryRes}
   activeTimer={'error' in timerRes ? null : timerRes.timer || null}
   projects={'error' in projectsRes ? [] : projectsRes.projects || []}
  />
 )
}
