'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Timer, Euro, CheckCircle2, ScrollText, TrendingUp, Receipt } from 'lucide-react'
import { StatCard } from './project-kanban'
import { ProjectHubData, HubSummary, formatCurrency, formatDate, formatDuration, invoiceStatusConfig } from './project-hub-types'

export default function ProjectOverviewTab({
  project,
  summary,
  completedTasks,
  totalTasks,
  progress,
  budgetUsed,
  budgetRatio,
  hoursRatio,
}: {
  project: ProjectHubData
  summary: HubSummary
  completedTasks: number
  totalTasks: number
  progress: number
  budgetUsed: number
  budgetRatio: number
  hoursRatio: number
}) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Timer className="w-4 h-4" />}
          label="Temps total"
          value={`${summary.totalHours}h`}
          subValue={`${summary.billableHours}h facturables`}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          icon={<Euro className="w-4 h-4" />}
          label="Facturé"
          value={formatCurrency(summary.invoiceTotal)}
          subValue={`${formatCurrency(summary.invoicePaid)} encaissé`}
          color="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Tâches"
          value={`${completedTasks}/${totalTasks}`}
          subValue={`${progress}% terminé`}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
        />
        <StatCard
          icon={<ScrollText className="w-4 h-4" />}
          label="Documents"
          value={`${summary.invoiceCount + summary.contractCount}`}
          subValue={`${summary.invoiceCount} facture(s) • ${summary.contractCount} contrat(s)`}
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
        />
      </div>

      {/* Budget Progress */}
      {(project.budgetAmount || project.budgetHours) && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Consommation du budget
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.budgetAmount ? (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-medium text-foreground">{formatCurrency(budgetUsed)} / {formatCurrency(project.budgetAmount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${budgetRatio > 90 ? 'bg-red-500' : budgetRatio > 70 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${Math.min(budgetRatio, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {budgetRatio}% consommé{budgetUsed < project.budgetAmount! && ` · Reste ${formatCurrency(project.budgetAmount! - budgetUsed)}`}
                </p>
              </div>
            ) : null}
            {project.budgetHours ? (
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Heures</span>
                  <span className="font-medium text-foreground">{summary.totalHours}h / {project.budgetHours}h</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${hoursRatio > 90 ? 'bg-red-500' : hoursRatio > 70 ? 'bg-yellow-500' : 'bg-primary'}`} style={{ width: `${Math.min(hoursRatio, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hoursRatio}% consommé{summary.totalHours < project.budgetHours! && ` · Reste ${Math.round((project.budgetHours! - summary.totalHours) * 10) / 10}h`}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Time Entries */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Temps récent
            </h3>
            <Link href="/dashboard/time">
              <Button variant="ghost" size="sm" className="text-xs">Voir tout</Button>
            </Link>
          </div>
          {project.timeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune entrée de temps</p>
          ) : (
            <div className="space-y-3">
              {project.timeEntries.slice(0, 5).map(entry => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-foreground">{entry.description || entry.task?.title || 'Sans description'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)} • {entry.user?.firstName || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-foreground">{formatDuration(entry.duration)}</span>
                    {entry.isBillable && <Badge className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">€</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Dernières factures
            </h3>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm" className="text-xs">Voir tout</Button>
            </Link>
          </div>
          {project.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune facture liée</p>
          ) : (
            <div className="space-y-3">
              {project.invoices.slice(0, 5).map(inv => {
                const invStatus = invoiceStatusConfig[inv.status || 'draft']
                return (
                  <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between text-sm hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors">
                    <div>
                      <p className="text-foreground font-medium">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">{inv.title || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${invStatus.color}`}>{invStatus.label}</Badge>
                      <span className="font-medium text-foreground">{formatCurrency(inv.total || 0)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
