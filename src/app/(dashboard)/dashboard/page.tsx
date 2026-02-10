import { Suspense } from 'react'
import { getDashboardKPIs, getRevenueChartData, getRecentActivity } from '@/lib/actions/dashboard'
import DashboardClient from './dashboard-client'
import { Loader2 } from 'lucide-react'

// Helper to parse date
const parseDate = (d: string | string[] | undefined) => {
 if (typeof d === 'string' && !isNaN(Date.parse(d))) {
  return new Date(d)
 }
 return undefined
}

export default async function DashboardPage({
 searchParams
}: {
 searchParams: Promise<{ from?: string; to?: string }>
}) {
 const params = await searchParams
 const from = parseDate(params.from)
 const to = parseDate(params.to)
 const range = from && to ? { from, to } : undefined

 const [kpis, chartData, activity] = await Promise.all([
  getDashboardKPIs(range), // Pass range here
  getRevenueChartData(), // Could pass range here too for charts if desired, but usually charts show fixed history. 
  // To be consistent, chart data usually ignores filter to show trends, OR adapts. 
  // Let's keep chart fixed for now as "Last 6 months" is explicit in UI title.
  getRecentActivity()
 ])

 // Client will need to know the current range to control the picker
 return (
  <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
   <DashboardClient
    kpis={'error' in kpis ? null : kpis}
    chartData={'error' in chartData ? [] : chartData.data || []}
    activities={'error' in activity ? [] : activity.activities || []}
    defaultDate={range}
   />
  </Suspense>
 )
}
