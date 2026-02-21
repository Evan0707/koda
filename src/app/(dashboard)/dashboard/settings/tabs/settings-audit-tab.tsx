'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { History } from 'lucide-react'

export default function SettingsAuditTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Historique d&apos;activité
        </CardTitle>
        <CardDescription>
          Traçabilité de toutes les actions effectuées sur votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">
            Consultez l&apos;historique complet de toutes les actions (création, modification, envoi...)
          </p>
          <a
            href="/dashboard/settings/audit-logs"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Voir l&apos;historique complet
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
