'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { StatusBadge, type StatusConfig } from '@/components/status-badge'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import { formatPrice } from '@/lib/currency'
import { Plus, FileText, ArrowRight, Download } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'expired', label: 'Expiré' },
]

export default function QuotesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes] = useState(initialQuotes)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

  // Filter quotes client-side
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = !search ||
        quote.number?.toLowerCase().includes(search.toLowerCase()) ||
        quote.title?.toLowerCase().includes(search.toLowerCase()) ||
        quote.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
        quote.contact?.firstName?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [quotes, search, statusFilter])

  const QUOTE_STATUSES: Record<string, StatusConfig> = {
    draft: { label: 'Brouillon', variant: 'muted' },
    sent: { label: 'Envoyé', variant: 'blue' },
    accepted: { label: 'Accepté', variant: 'green' },
    rejected: { label: 'Refusé', variant: 'red' },
    expired: { label: 'Expiré', variant: 'orange' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Devis"
        description="Gérez vos propositions commerciales"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <a href="/api/export/quotes" download>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exporter CSV
              </Button>
            </a>
            <Link href="/dashboard/quotes/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau devis
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un devis..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {filteredQuotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={quotes.length === 0 ? 'Aucun devis' : 'Aucun résultat'}
            description={quotes.length === 0
              ? 'Créez votre premier devis pour commencer.'
              : 'Aucun devis ne correspond à vos critères.'}
            action={quotes.length === 0
              ? { label: 'Créer un devis', href: '/dashboard/quotes/create' }
              : undefined}
            secondaryAction={quotes.length > 0 && (statusFilter !== 'all' || search)
              ? { label: 'Réinitialiser les filtres', onClick: () => { setSearch(''); setStatusFilter('all') } }
              : undefined}
          />
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => (
                <TableRow key={quote.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}>
                  <TableCell className="font-medium text-primary">
                    {quote.number}
                    {quote.title && <div className="text-xs text-muted-foreground font-normal">{quote.title}</div>}
                  </TableCell>
                  <TableCell>
                    {quote.company?.name || (quote.contact ? `${quote.contact.firstName} ${quote.contact.lastName}` : '—')}
                  </TableCell>
                  <TableCell>
                    {quote.issueDate ? new Date(quote.issueDate).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(quote.total)}
                  </TableCell>
                  <TableCell>{<StatusBadge status={quote.status} statusConfig={QUOTE_STATUSES} />}</TableCell>
                  <TableCell>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
