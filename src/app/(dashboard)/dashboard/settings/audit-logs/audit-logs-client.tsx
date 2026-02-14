'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table'
import {
 History,
 FileText,
 Receipt,
 Users,
 Building2,
 FolderKanban,
 Settings,
 Shield,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { EmptyState } from '@/components/empty-state'

type AuditLog = {
 id: string
 action: string
 entityType: string
 entityId: string | null
 metadata: any
 ipAddress: string | null
 createdAt: Date
 user: {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
 } | null
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
 quote: <FileText className="w-4 h-4" />,
 invoice: <Receipt className="w-4 h-4" />,
 contact: <Users className="w-4 h-4" />,
 company: <Building2 className="w-4 h-4" />,
 project: <FolderKanban className="w-4 h-4" />,
 settings: <Settings className="w-4 h-4" />,
 auth: <Shield className="w-4 h-4" />,
}

const ACTION_LABELS: Record<string, string> = {
 'quote.created': 'Devis créé',
 'quote.updated': 'Devis modifié',
 'quote.deleted': 'Devis supprimé',
 'quote.sent': 'Devis envoyé',
 'quote.signed': 'Devis signé',
 'invoice.created': 'Facture créée',
 'invoice.updated': 'Facture modifiée',
 'invoice.deleted': 'Facture supprimée',
 'invoice.sent': 'Facture envoyée',
 'invoice.paid': 'Facture payée',
 'contact.created': 'Contact créé',
 'contact.updated': 'Contact modifié',
 'contact.deleted': 'Contact supprimé',
 'company.created': 'Entreprise créée',
 'company.updated': 'Entreprise modifiée',
 'company.deleted': 'Entreprise supprimée',
 'project.created': 'Projet créé',
 'project.updated': 'Projet modifié',
 'project.deleted': 'Projet supprimé',
 'contract.created': 'Contrat créé',
 'contract.updated': 'Contrat modifié',
 'contract.deleted': 'Contrat supprimé',
 'contract.signed': 'Contrat signé',
 'settings.profile_updated': 'Profil mis à jour',
 'settings.password_changed': 'Mot de passe modifié',
 'settings.gmail_connected': 'Gmail connecté',
 'settings.gmail_disconnected': 'Gmail déconnecté',
 'auth.login': 'Connexion',
 'auth.logout': 'Déconnexion',
}

const ACTION_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
 created: 'default',
 updated: 'secondary',
 deleted: 'destructive',
 sent: 'outline',
 signed: 'default',
 paid: 'default',
}

function getActionColor(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
 const verb = action.split('.')[1]
 return ACTION_COLORS[verb] || 'secondary'
}

export function AuditLogsClient({ initialLogs }: { initialLogs: AuditLog[] }) {
 const [filter, setFilter] = useState<string>('all')

 const filteredLogs = filter === 'all'
  ? initialLogs
  : initialLogs.filter(log => log.entityType === filter)

 const entityTypes = [...new Set(initialLogs.map(log => log.entityType))]

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
      <History className="w-6 h-6" />
      Historique d'activité
     </h1>
     <p className="text-muted-foreground">
      Traçabilité de toutes les actions effectuées
     </p>
    </div>

    <Select value={filter} onValueChange={setFilter}>
     <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filtrer par type" />
     </SelectTrigger>
     <SelectContent>
      <SelectItem value="all">Tous les types</SelectItem>
      {entityTypes.map(type => (
       <SelectItem key={type} value={type}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
       </SelectItem>
      ))}
     </SelectContent>
    </Select>
   </div>

   <Card>
    <CardHeader>
     <CardTitle>Activité récente</CardTitle>
     <CardDescription>
      Les 100 dernières actions
     </CardDescription>
    </CardHeader>
    <CardContent>
     {filteredLogs.length === 0 ? (
      <EmptyState
       icon={History}
       title="Aucune activité enregistrée"
       description="Les actions seront affichées ici"
      />
     ) : (
      <Table>
       <TableHeader>
        <TableRow>
         <TableHead>Action</TableHead>
         <TableHead>Type</TableHead>
         <TableHead>Utilisateur</TableHead>
         <TableHead>Date</TableHead>
         <TableHead>IP</TableHead>
        </TableRow>
       </TableHeader>
       <TableBody>
        {filteredLogs.map(log => (
         <TableRow key={log.id}>
          <TableCell>
           <Badge variant={getActionColor(log.action)}>
            {ACTION_LABELS[log.action] || log.action}
           </Badge>
          </TableCell>
          <TableCell>
           <div className="flex items-center gap-2 text-muted-foreground">
            {ENTITY_ICONS[log.entityType] || <FileText className="w-4 h-4" />}
            <span className="capitalize">{log.entityType}</span>
           </div>
          </TableCell>
          <TableCell>
           {log.user ? (
            <span>
             {log.user.firstName} {log.user.lastName}
            </span>
           ) : (
            <span className="text-muted-foreground">Système</span>
           )}
          </TableCell>
          <TableCell className="text-muted-foreground">
           {formatDistanceToNow(new Date(log.createdAt), {
            addSuffix: true,
            locale: fr,
           })}
          </TableCell>
          <TableCell className="text-muted-foreground font-mono text-sm">
           {log.ipAddress || '-'}
          </TableCell>
         </TableRow>
        ))}
       </TableBody>
      </Table>
     )}
    </CardContent>
   </Card>
  </div>
 )
}
