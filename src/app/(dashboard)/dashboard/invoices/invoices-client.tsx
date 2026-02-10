'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, FileText, ArrowRight, Download, Filter } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

export default function InvoicesClient({ initialInvoices }: { initialInvoices: any[] }) {
  const [invoices] = useState(initialInvoices)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      cancelled: 'bg-muted/50 text-muted-foreground',
    }

    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyée',
      paid: 'Payée',
      overdue: 'En retard',
      cancelled: 'Annulée',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    )
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer depuis devis
              </Button>
            </Link>
          </>
        }
      />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {invoices.length === 0 ? 'Aucune facture' : 'Aucun résultat'}
            </h3>
            <p className="mb-4">
              {invoices.length === 0
                ? 'Convertissez un devis pour créer votre première facture.'
                : 'Aucune facture ne correspond à vos critères.'}
            </p>
            {invoices.length === 0 && (
              <Link href="/dashboard/quotes">
                <Button>Aller aux devis</Button>
              </Link>
            )}
            {invoices.length > 0 && (statusFilter !== 'all' || search) && (
              <Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('all') }}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Date d'émission</TableHead>
                <TableHead className="hidden md:table-cell">Échéance</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10"></TableHead>
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
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
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
