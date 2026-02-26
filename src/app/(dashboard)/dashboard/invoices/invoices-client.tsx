'use client'

import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, FileText, ArrowRight, Download, Trash2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { StatusBadge, type StatusConfig } from '@/components/status-badge'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import { formatPrice } from '@/lib/currency'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { archiveInvoice } from '@/lib/actions/invoices'
import { useConfirm } from '@/components/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

const INVOICE_STATUSES: Record<string, StatusConfig> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyée', variant: 'blue' },
  paid: { label: 'Payée', variant: 'green' },
  overdue: { label: 'En retard', variant: 'red' },
  cancelled: { label: 'Annulée', variant: 'muted' },
}

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { confirm } = useConfirm()

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    confirm({
      title: 'Archiver cette facture ?',
      description: 'Cette facture sera archivée et supprimée définitivement après 30 jours.',
      confirmText: 'Archiver',
      variant: 'destructive',
      onConfirm: async () => {
        setArchivingId(id)
        startTransition(async () => {
          const result = await archiveInvoice(id)
          setArchivingId(null)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Facture archivée')
            setInvoices(prev => prev.filter(inv => inv.id !== id))
          }
        })
      }
    })
  }

  // Filter invoices client-side
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = !search ||
        invoice.number?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.title?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
        invoice.contact?.firstName?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

  // Define columns
  const columns: ColumnDef<any>[] = [
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
        const inv = row.original
        return inv.company?.name || (inv.contact ? `${inv.contact.firstName} ${inv.contact.lastName}` : '—')
      }
    },
    {
      accessorKey: 'issueDate',
      header: 'Date d\'émission',
      cell: ({ row }) => {
        return row.original.issueDate ? new Date(row.original.issueDate).toLocaleDateString('fr-FR') : '—'
      }
    },
    {
      accessorKey: 'dueDate',
      header: 'Échéance',
      cell: ({ row }) => {
        return row.original.dueDate ? new Date(row.original.dueDate).toLocaleDateString('fr-FR') : '—'
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
        <StatusBadge status={row.original.status} statusConfig={INVOICE_STATUSES} />
      ),
      filterFn: (row, id, filterValue) => {
        if (filterValue === 'all') return true
        return row.original.status === filterValue
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => handleArchive(e, inv.id)}
              disabled={archivingId === inv.id}
            >
              {archivingId === inv.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
            </Button>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Factures"
        description="Gérez vos factures et suivis de paiement"
        icon={FileText}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/export/invoices?format=csv'}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/api/export/invoices?format=fec'}>
              <Download className="w-4 h-4 mr-2" />
              FEC
            </Button>
            <Link href="/dashboard/quotes">
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Créer depuis devis
              </Button>
            </Link>
            <Link href="/dashboard/invoices/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle facture
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une facture..."
          className="min-w-[200px]"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="bg-card rounded-lg overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={invoices.length === 0 ? 'Aucune facture' : 'Aucun résultat'}
            description={invoices.length === 0
              ? 'Créez votre première facture ou convertissez un devis.'
              : 'Aucune facture ne correspond à vos critères.'}
            action={invoices.length === 0
              ? { label: 'Nouvelle facture', href: '/dashboard/invoices/create' }
              : undefined}
            secondaryAction={invoices.length > 0 && (statusFilter !== 'all' || search)
              ? { label: 'Réinitialiser les filtres', onClick: () => { setSearch(''); setStatusFilter('all') } }
              : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredInvoices}
            onRowClick={(row) => router.push(`/dashboard/invoices/${row.id}`)}
          />
        )}
      </div>
    </div>
  )
}
