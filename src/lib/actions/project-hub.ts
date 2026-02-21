'use server'

import { db } from '@/db'
import { projects, timeEntries } from '@/db/schema/projects'
import { invoices } from '@/db/schema/billing'
import { contracts } from '@/db/schema/legal'
import { getOrganizationId } from '@/lib/auth'
import { and, eq, isNull, desc, sum } from 'drizzle-orm'

/**
 * Fetches all hub data for a project: invoices, quotes (via project.quoteId), 
 * contracts, and time entries with summary stats.
 */
export async function getProjectHubData(projectId: string) {
  try {
    const organizationId = await getOrganizationId()

    // Fetch project with ALL relations including invoices, contracts, timeEntries
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt)
      ),
      with: {
        company: true,
        quote: {
          with: {
            items: true,
            company: true,
            contact: true,
          }
        },
        owner: {
          columns: { id: true, firstName: true, lastName: true }
        },
        manager: {
          columns: { id: true, firstName: true, lastName: true }
        },
        tasks: {
          where: (tasks, { isNull }) => isNull(tasks.deletedAt),
          orderBy: (tasks, { asc }) => [asc(tasks.position)],
          with: {
            assignee: {
              columns: { id: true, firstName: true, lastName: true }
            }
          }
        },
        invoices: {
          with: {
            company: true,
            contact: true,
          },
          orderBy: [desc(invoices.createdAt)],
        },
        contracts: {
          where: (contracts, { isNull }) => isNull(contracts.deletedAt),
          with: {
            company: true,
            contact: true,
          },
          orderBy: [desc(contracts.createdAt)],
        },
        timeEntries: {
          orderBy: [desc(timeEntries.date)],
          with: {
            task: {
              columns: { id: true, title: true }
            },
            user: {
              columns: { id: true, firstName: true, lastName: true }
            }
          }
        },
      }
    })

    if (!project) return { error: 'Projet non trouvé' }

    // Compute time summary
    const totalMinutes = project.timeEntries.reduce((acc, e) => acc + (e.duration || 0), 0)
    const billableMinutes = project.timeEntries.reduce(
      (acc, e) => acc + (e.isBillable ? (e.duration || 0) : 0), 0
    )

    // Compute invoice summary
    const invoiceTotal = project.invoices.reduce((acc, inv) => acc + (inv.total || 0), 0)
    const invoicePaid = project.invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0)

    const summary = {
      totalMinutes,
      billableMinutes,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      billableHours: Math.round(billableMinutes / 60 * 10) / 10,
      invoiceTotal,
      invoicePaid,
      invoiceCount: project.invoices.length,
      contractCount: project.contracts.length,
      timeEntryCount: project.timeEntries.length,
    }

    return { project, summary }
  } catch (error) {
    console.error('Error fetching project hub data:', error)
    return { error: 'Erreur lors de la récupération des données du projet' }
  }
}
