'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollText, ExternalLink } from 'lucide-react'
import { ProjectHubData, formatDate, contractStatusConfig } from './project-hub-types'

export default function ProjectContractsTab({ project }: { project: ProjectHubData }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Contrats</h2>
        <Link href="/dashboard/contracts">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Tous les contrats
          </Button>
        </Link>
      </div>

      {project.contracts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <ScrollText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun contrat lié à ce projet</p>
          <p className="text-xs text-muted-foreground mt-1">Créez un contrat et associez-le à ce projet</p>
          <Link href="/dashboard/contracts" className="mt-3 inline-block">
            <Button variant="outline" size="sm">Créer un contrat</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Titre</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Client</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Date d&apos;effet</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Expiration</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase">Statut</th>
              </tr>
            </thead>
            <tbody>
              {project.contracts.map(contract => {
                const cStatus = contractStatusConfig[contract.status || 'draft']
                return (
                  <tr key={contract.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Link href={`/dashboard/contracts/${contract.id}`} className="text-sm font-medium text-primary hover:underline">
                        {contract.title}
                      </Link>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{contract.company?.name || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(contract.effectiveDate)}</td>
                    <td className="p-3 text-sm text-muted-foreground">{formatDate(contract.expirationDate)}</td>
                    <td className="p-3">
                      <Badge className={`text-xs ${cStatus.color}`}>{cStatus.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
