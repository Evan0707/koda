'use client'

import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { StatusBadge, type StatusConfig } from '@/components/status-badge'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import { formatPrice } from '@/lib/currency'
import { Plus, FileText, ArrowRight, Download, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { archiveQuote } from '@/lib/actions/quotes'
import { useConfirm } from '@/components/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyé' },
  { value: 'accepted', label: 'Accepté' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'expired', label: 'Expiré' },
]

const QUOTE_STATUSES: Record<string, StatusConfig> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyé', variant: 'blue' },
  accepted: { label: 'Accepté', variant: 'green' },
  rejected: { label: 'Refusé', variant: 'red' },
  expired: { label: 'Expiré', variant: 'orange' },
}

export default function QuotesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState(initialQuotes)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { confirm } = useConfirm()

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    confirm({
      title: 'Archiver ce devis ?',
      description: 'Ce devis sera archivé et supprimé définitivement après 30 jours.',
      confirmText: 'Archiver',
      variant: 'destructive',
      onConfirm: async () => {
        setArchivingId(id)
        startTransition(async () => {
          const result = await archiveQuote(id)
          setArchivingId(null)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Devis archivé')
            setQuotes(prev => prev.filter(q => q.id !== id))
          }
        })
      }
    })
  }

  // Define columns
  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'number',
      header: 'Numéro',
      cell: ({ row }) => (
        <div className="font-medium text-primary">
          {row.original.number}
          {row.original.title && <div className="text-xs text-muted-foreground font-normal">{row.original.title}</div>}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        const title = row.original.title?.toLowerCase() || ''
        const number = row.original.number?.toLowerCase() || ''
        const search = filterValue.toLowerCase()
        return title.includes(search) || number.includes(search)
      }
    },
    {
      id: 'client',
      header: 'Client',
      cell: ({ row }) => {
        const q = row.original
        return q.company?.name || (q.contact ? `${q.contact.firstName} ${q.contact.lastName}` : '—')
      }
    },
    {
      accessorKey: 'issueDate',
      header: 'Date',
      cell: ({ row }) => {
        return row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString('fr-FR') : '—'
      }
    },
    {
      accessorKey: 'total',
      header: 'Montant TTC',
      cell: ({ row }) => (
        <div className="font-medium">{formatPrice(row.original.total)}</div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} statusConfig={QUOTE_STATUSES} />
      ),
      filterFn: (row, id, filterValue) => {
        if (filterValue === 'all') return true
        return row.original.status === filterValue
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const q = row.original
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => handleArchive(e, q.id)}
              disabled={archivingId === q.id}
            >
              {archivingId === q.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </Button>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )
      }
    }
  ], [archivingId])

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

      <div className="bg-card rounded-lg overflow-hidden">
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
          <DataTable
            columns={columns}
            data={filteredQuotes}
            onRowClick={(row) => router.push(`/dashboard/quotes/${row.id}`)}
          />
        )}
      </div>
    </div>
  )
}
