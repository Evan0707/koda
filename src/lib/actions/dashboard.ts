'use server'

import { db } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { invoices, quotes } from '@/db/schema/billing'
import { opportunities, pipelineStages } from '@/db/schema/crm'
import { projects, tasks, timeEntries } from '@/db/schema/projects'
import { and, eq, isNull, sql, gte, lte, desc, count, sum } from 'drizzle-orm'

// Get dashboard KPIs
export async function getDashboardKPIs(range?: { from?: Date; to?: Date }) {
 try {
  const organizationId = await getOrganizationId()

  const now = new Date()

  // Default: Current month
  let startPeriod = range?.from || new Date(now.getFullYear(), now.getMonth(), 1)
  let endPeriod = range?.to || new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Clean dates (start of day / end of day)
  startPeriod.setHours(0, 0, 0, 0)
  endPeriod.setHours(23, 59, 59, 999)

  // Previous period (same duration)
  const duration = endPeriod.getTime() - startPeriod.getTime()
  const startOfPrevPeriod = new Date(startPeriod.getTime() - duration - 1) // -1 ensures no overlap if exactly same
  const endOfPrevPeriod = new Date(startPeriod.getTime() - 1)

  // If default (month), align to previous month
  if (!range) {
   startOfPrevPeriod.setTime(new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime())
   endOfPrevPeriod.setTime(new Date(now.getFullYear(), now.getMonth(), 0).getTime())
  }

  // Revenue this period
  const [revenueResult] = await db
   .select({ total: sum(invoices.total) })
   .from(invoices)
   .where(and(
    eq(invoices.organizationId, organizationId),
    eq(invoices.status, 'paid'),
    gte(invoices.paidAt, startPeriod),
    lte(invoices.paidAt, endPeriod)
   ))
  const revenueThisMonth = Number(revenueResult?.total || 0)

  // Revenue previous period
  const [prevRevenueResult] = await db
   .select({ total: sum(invoices.total) })
   .from(invoices)
   .where(and(
    eq(invoices.organizationId, organizationId),
    eq(invoices.status, 'paid'),
    gte(invoices.paidAt, startOfPrevPeriod),
    lte(invoices.paidAt, endOfPrevPeriod)
   ))
  const revenuePrevMonth = Number(prevRevenueResult?.total || 0)

  // Revenue change percentage
  const revenueChange = revenuePrevMonth > 0
   ? Math.round(((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
   : revenueThisMonth > 0 ? 100 : 0

  // Pending quotes
  const [quotesResult] = await db
   .select({
    count: count(),
    total: sum(quotes.total)
   })
   .from(quotes)
   .where(and(
    eq(quotes.organizationId, organizationId),
    eq(quotes.status, 'sent'),
    isNull(quotes.deletedAt)
   ))
  const pendingQuotes = Number(quotesResult?.count || 0)
  const pendingQuotesValue = Number(quotesResult?.total || 0)

  // Unpaid invoices
  const [invoicesResult] = await db
   .select({
    count: count(),
    total: sum(invoices.total)
   })
   .from(invoices)
   .where(and(
    eq(invoices.organizationId, organizationId),
    sql`${invoices.status} IN ('sent', 'overdue')`,
    isNull(invoices.deletedAt)
   ))
  const unpaidInvoices = Number(invoicesResult?.count || 0)
  const unpaidInvoicesValue = Number(invoicesResult?.total || 0)

  // Active projects
  const [projectsResult] = await db
   .select({ count: count() })
   .from(projects)
   .where(and(
    eq(projects.organizationId, organizationId),
    eq(projects.status, 'active'),
    isNull(projects.deletedAt)
   ))
  const activeProjects = Number(projectsResult?.count || 0)

  // Active tasks
  const [tasksResult] = await db
   .select({ count: count() })
   .from(tasks)
   .where(and(
    eq(tasks.organizationId, organizationId),
    sql`${tasks.status} IN ('todo', 'in_progress', 'review')`,
    isNull(tasks.deletedAt)
   ))
  const activeTasks = Number(tasksResult?.count || 0)

  // Pipeline value (active opportunities, not won/lost)
  const stagesData = await db
   .select()
   .from(pipelineStages)
   .where(eq(pipelineStages.organizationId, organizationId))

  const excludedStageIds = stagesData
   .filter(s => s.isWon || s.isLost)
   .map(s => s.id)

  const [pipelineResult] = await db
   .select({
    count: count(),
    total: sum(opportunities.value),
    weighted: sql<number>`SUM(${opportunities.value} * ${opportunities.probability} / 100)`
   })
   .from(opportunities)
   .where(and(
    eq(opportunities.organizationId, organizationId),
    excludedStageIds.length > 0
     ? sql`${opportunities.stageId} NOT IN (${sql.join(excludedStageIds.map(id => sql`${id}`), sql`, `)})`
     : sql`1=1`,
    isNull(opportunities.deletedAt)
   ))
  const pipelineCount = Number(pipelineResult?.count || 0)
  const pipelineValue = Number(pipelineResult?.total || 0)
  const pipelineWeighted = Number(pipelineResult?.weighted || 0)

  return {
   revenue: {
    value: revenueThisMonth,
    change: revenueChange,
    trend: revenueChange >= 0 ? 'up' : 'down'
   },
   pendingQuotes: {
    count: pendingQuotes,
    value: pendingQuotesValue
   },
   unpaidInvoices: {
    count: unpaidInvoices,
    value: unpaidInvoicesValue
   },
   projects: {
    active: activeProjects,
    projects: activeProjects, // Add this to satisfy interface
    tasks: activeTasks
   },
   pipeline: {
    count: pipelineCount,
    value: pipelineValue,
    weighted: pipelineWeighted
   }
  }
 } catch (error) {
  console.error('Error fetching dashboard KPIs:', error)
  return { error: 'Erreur lors de la récupération des KPIs' }
 }
}

// Get revenue chart data (last 6 months)
export async function getRevenueChartData() {
 try {
  const organizationId = await getOrganizationId()

  const months = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
   const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
   const startOfMonth = date
   const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

   const [result] = await db
    .select({ total: sum(invoices.total) })
    .from(invoices)
    .where(and(
     eq(invoices.organizationId, organizationId),
     eq(invoices.status, 'paid'),
     gte(invoices.paidAt, startOfMonth),
     lte(invoices.paidAt, endOfMonth)
    ))

   months.push({
    month: date.toLocaleDateString('fr-FR', { month: 'short' }),
    revenue: Number(result?.total || 0) / 100
   })
  }

  return { data: months }
 } catch (error) {
  console.error('Error fetching revenue chart:', error)
  return { error: 'Erreur' }
 }
}

// Get recent activity
export async function getRecentActivity() {
 try {
  const organizationId = await getOrganizationId()

  // Combine recent items from different tables
  const [recentQuotes, recentInvoices, recentProjects] = await Promise.all([
   db.query.quotes.findMany({
    where: and(
     eq(quotes.organizationId, organizationId),
     isNull(quotes.deletedAt)
    ),
    columns: { id: true, number: true, title: true, status: true, createdAt: true },
    orderBy: [desc(quotes.createdAt)],
    limit: 3
   }),
   db.query.invoices.findMany({
    where: and(
     eq(invoices.organizationId, organizationId),
     isNull(invoices.deletedAt)
    ),
    columns: { id: true, number: true, status: true, createdAt: true },
    orderBy: [desc(invoices.createdAt)],
    limit: 3
   }),
   db.query.projects.findMany({
    where: and(
     eq(projects.organizationId, organizationId),
     isNull(projects.deletedAt)
    ),
    columns: { id: true, name: true, status: true, createdAt: true },
    orderBy: [desc(projects.createdAt)],
    limit: 3
   })
  ])

  // Combine and sort
  const activities = [
   ...recentQuotes.map(q => ({
    type: 'quote' as const,
    id: q.id,
    title: q.title || `Devis ${q.number}`,
    status: q.status,
    createdAt: q.createdAt,
    href: `/dashboard/quotes/${q.id}`
   })),
   ...recentInvoices.map(i => ({
    type: 'invoice' as const,
    id: i.id,
    title: `Facture ${i.number}`,
    status: i.status,
    createdAt: i.createdAt,
    href: `/dashboard/invoices/${i.id}`
   })),
   ...recentProjects.map(p => ({
    type: 'project' as const,
    id: p.id,
    title: p.name,
    status: p.status,
    createdAt: p.createdAt,
    href: `/dashboard/projects/${p.id}`
   }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 5)

  return { activities }
 } catch (error) {
  console.error('Error fetching recent activity:', error)
  return { error: 'Erreur' }
 }
}
