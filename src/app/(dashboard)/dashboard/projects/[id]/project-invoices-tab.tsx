'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, ExternalLink } from 'lucide-react'
import { ProjectHubData, HubSummary, formatCurrency, formatDate, invoiceStatusConfig } from './project-hub-types'

export default function ProjectInvoicesTab({
  project,
  summary,
}: {
  project: ProjectHubData
  summary: HubSummary
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Factures</h2>
        <Link href="/dashboard/invoices">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Toutes les factures
          </Button>
        </Link>
      </div>

      {project.invoices.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune facture liée à ce projet</p>
          <p className="text-xs text-muted-foreground mt-1">Créez une facture et associez-la à ce projet</p>
          <Link href="/dashboard/invoices" className="mt-3 inline-block">
            <Button variant="outline" size="sm">Créer une facture</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Numéro</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Titre</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Client</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase">Montant</th>
              </tr>
            </thead>
            <tbody>
              {project.invoices.map(inv => {
                const invStatus = invoiceStatusConfig[inv.status || 'draft']
                return (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="text-sm font-medium text-primary hover:underline">
                        {inv.number}
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-foreground">{inv.title || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{inv.company?.name || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(inv.issueDate)}</td>
                    <td className="p-3">
                      <Badge className={`text-xs ${invStatus.color}`}>{invStatus.label}</Badge>
                    </td>
                    <td className="p-3 text-sm text-foreground text-right font-medium">{formatCurrency(inv.total || 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Invoice totals */}
          <div className="border-t border-border bg-muted/30 p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{project.invoices.length} facture(s)</span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Encaissé: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(summary.invoicePaid)}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatCurrency(summary.invoiceTotal)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
