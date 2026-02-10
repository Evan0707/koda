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
import { PageHeader } from '@/components/page-header'
import { Plus, Search, FileText, ArrowRight, Filter } from 'lucide-react'
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
      accepted: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      expired: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
    }

    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
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
        title="Devis"
        description="Gérez vos propositions commerciales"
        icon={FileText}
        actions={
          <Link href="/dashboard/quotes/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un devis..."
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
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {quotes.length === 0 ? 'Aucun devis' : 'Aucun résultat'}
            </h3>
            <p className="mb-4">
              {quotes.length === 0
                ? 'Créez votre premier devis pour commencer.'
                : 'Aucun devis ne correspond à vos critères.'}
            </p>
            {quotes.length === 0 && (
              <Link href="/dashboard/quotes/create">
                <Button variant="outline">Créer un devis</Button>
              </Link>
            )}
            {quotes.length > 0 && (statusFilter !== 'all' || search) && (
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
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
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
