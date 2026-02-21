'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Timer, ExternalLink } from 'lucide-react'
import { ProjectHubData, HubSummary, formatDate, formatDuration } from './project-hub-types'

export default function ProjectTimeTab({
  project,
  summary,
}: {
  project: ProjectHubData
  summary: HubSummary
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Suivi du temps</h2>
        <Link href="/dashboard/time">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Tracker
          </Button>
        </Link>
      </div>

      {/* Time summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{summary.totalHours}h</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.billableHours}h</p>
          <p className="text-sm text-muted-foreground">Facturables</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-muted-foreground">{Math.round((summary.totalHours - summary.billableHours) * 10) / 10}h</p>
          <p className="text-sm text-muted-foreground">Non facturables</p>
        </div>
      </div>

      {/* Time entries table */}
      {project.timeEntries.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Timer className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune entrée de temps pour ce projet</p>
          <Link href="/dashboard/time" className="mt-3 inline-block">
            <Button variant="outline" size="sm">Ajouter du temps</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Description</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Tâche</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Personne</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Durée</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase">Fact.</th>
              </tr>
            </thead>
            <tbody>
              {project.timeEntries.map(entry => (
                <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-3 text-sm text-foreground">{formatDate(entry.date)}</td>
                  <td className="p-3 text-sm text-foreground">{entry.description || '—'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{entry.task?.title || '—'}</td>
                  <td className="p-3 text-sm text-muted-foreground">{entry.user?.firstName || '—'}</td>
                  <td className="p-3 text-sm text-foreground text-right font-medium">{formatDuration(entry.duration)}</td>
                  <td className="p-3 text-center">
                    {entry.isBillable ? (
                      <Badge className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Oui</Badge>
                    ) : (
                      <Badge className="text-xs bg-muted text-muted-foreground">Non</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
