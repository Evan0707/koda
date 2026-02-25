'use client'

import { useState, useMemo, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices, setInvoices] = useState(initialInvoices)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const { confirm } = useConfirm()

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

  const INVOICE_STATUSES: Record<string, StatusConfig> = {
    draft: { label: 'Brouillon', variant: 'muted' },
    sent: { label: 'Envoyée', variant: 'blue' },
    paid: { label: 'Payée', variant: 'green' },
    overdue: { label: 'En retard', variant: 'red' },
    cancelled: { label: 'Annulée', variant: 'muted' },
  }

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

      <div className="bg-card rounded-lg border overflow-hidden">
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
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Date d&apos;émission</TableHead>
                <TableHead className="hidden md:table-cell">Échéance</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
                  <TableCell className="font-medium text-primary">
                    {invoice.number}
                    {invoice.title && <div className="text-xs text-muted-foreground font-normal">{invoice.title}</div>}
                  </TableCell>
                  <TableCell>
                    {invoice.company?.name || (invoice.contact ? `${invoice.contact.firstName} ${invoice.contact.lastName}` : '—')}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(invoice.total)}
                  </TableCell>
                  <TableCell>{<StatusBadge status={invoice.status} statusConfig={INVOICE_STATUSES} />}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleArchive(e, invoice.id)}
                        disabled={archivingId === invoice.id}
                      >
                        {archivingId === invoice.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </Button>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
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
