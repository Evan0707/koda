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
import { Card, CardContent } from '@/components/ui/card'
import {
 Plus,
 Wallet,
 Trash2,
 Pencil,
 Receipt,
 TrendingUp,
 Clock,
 CheckCircle,
 Download,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { StatusBadge, type StatusConfig } from '@/components/status-badge'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import { formatPrice } from '@/lib/currency'
import { useConfirm } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import {
 deleteExpense,
 updateExpenseStatus,
 type ExpenseWithRelations,
} from '@/lib/actions/expenses'
import { ExpenseDialog } from './expense-dialog'
import type { ExpenseCategory } from '@/types/db'

const STATUS_OPTIONS = [
 { value: 'all', label: 'Tous les statuts' },
 { value: 'pending', label: 'En attente' },
 { value: 'approved', label: 'Approuvée' },
 { value: 'rejected', label: 'Rejetée' },
]

const EXPENSE_STATUSES: Record<string, StatusConfig> = {
 pending: { label: 'En attente', variant: 'yellow' },
 approved: { label: 'Approuvée', variant: 'green' },
 rejected: { label: 'Rejetée', variant: 'red' },
}

type Summary = {
 totalAmount: number
 totalVat: number
 count: number
 pendingCount: number
 approvedCount: number
}

export default function ExpensesClient({
 initialExpenses,
 categories,
 summary,
}: {
 initialExpenses: ExpenseWithRelations[]
 categories: ExpenseCategory[]
 summary: Summary
}) {
 const [expenses, setExpenses] = useState(initialExpenses)
 const [search, setSearch] = useState('')
 const [statusFilter, setStatusFilter] = useState('all')
 const [categoryFilter, setCategoryFilter] = useState('all')
 const [dialogOpen, setDialogOpen] = useState(false)
 const [editingExpense, setEditingExpense] = useState<ExpenseWithRelations | null>(null)
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

 const categoryOptions = useMemo(() => [
  { value: 'all', label: 'Toutes les catégories' },
  ...categories.map(c => ({ value: c.id, label: c.name })),
 ], [categories])

 const filteredExpenses = useMemo(() => {
  return expenses.filter(expense => {
   const matchesSearch = !search ||
    expense.description?.toLowerCase().includes(search.toLowerCase()) ||
    expense.category?.name?.toLowerCase().includes(search.toLowerCase())

   const matchesStatus = statusFilter === 'all' || expense.status === statusFilter
   const matchesCategory = categoryFilter === 'all' || expense.categoryId === categoryFilter

   return matchesSearch && matchesStatus && matchesCategory
  })
 }, [expenses, search, statusFilter, categoryFilter])

 const handleDelete = (id: string) => {
  confirm({
   title: 'Supprimer cette dépense ?',
   description: 'Cette action est irréversible.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteExpense(id)
    if (result.error) {
     toast.error(result.error)
    } else {
     setExpenses(prev => prev.filter(e => e.id !== id))
     toast.success('Dépense supprimée')
    }
   },
  })
 }

 const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
  startTransition(async () => {
   const result = await updateExpenseStatus(id, status)
   if (result.error) {
    toast.error(result.error)
   } else {
    setExpenses(prev =>
     prev.map(e => (e.id === id ? { ...e, status } : e))
    )
    toast.success(status === 'approved' ? 'Dépense approuvée' : 'Dépense rejetée')
   }
  })
 }

 const handleEdit = (expense: ExpenseWithRelations) => {
  setEditingExpense(expense)
  setDialogOpen(true)
 }

 const handleCreate = () => {
  setEditingExpense(null)
  setDialogOpen(true)
 }

 const handleSuccess = () => {
  // Page will revalidate from server action
  window.location.reload()
 }

 return (
  <div className="space-y-6 animate-fade-in">
   <PageHeader
    title="Dépenses"
    description="Suivez et catégorisez vos dépenses professionnelles"
    icon={Wallet}
    actions={
     <div className="flex items-center gap-2">
      <a href="/api/export/expenses" download>
       <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Exporter CSV
       </Button>
      </a>
      <Button onClick={handleCreate}>
       <Plus className="w-4 h-4 mr-2" />
       Nouvelle dépense
      </Button>
     </div>
    }
   />

   {/* Summary Cards */}
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Card>
     <CardContent className="pt-6">
      <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-primary/10">
        <TrendingUp className="w-5 h-5 text-primary" />
       </div>
       <div>
        <p className="text-sm text-muted-foreground">Total dépenses</p>
        <p className="text-2xl font-bold">{formatPrice(summary.totalAmount)}</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="pt-6">
      <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-yellow-500/10">
        <Clock className="w-5 h-5 text-yellow-500" />
       </div>
       <div>
        <p className="text-sm text-muted-foreground">En attente</p>
        <p className="text-2xl font-bold">{summary.pendingCount}</p>
       </div>
      </div>
     </CardContent>
    </Card>
    <Card>
     <CardContent className="pt-6">
      <div className="flex items-center gap-3">
       <div className="p-2 rounded-lg bg-green-500/10">
        <CheckCircle className="w-5 h-5 text-green-500" />
       </div>
       <div>
        <p className="text-sm text-muted-foreground">Approuvées</p>
        <p className="text-2xl font-bold">{summary.approvedCount}</p>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Filters */}
   <div className="flex items-center gap-4 flex-wrap">
    <SearchInput
     value={search}
     onChange={setSearch}
     placeholder="Rechercher une dépense..."
     className="min-w-[200px]"
    />
    <FilterSelect
     value={statusFilter}
     onChange={setStatusFilter}
     options={STATUS_OPTIONS}
    />
    <FilterSelect
     value={categoryFilter}
     onChange={setCategoryFilter}
     options={categoryOptions}
    />
   </div>

   {/* Table */}
   <div className="bg-card rounded-lg border overflow-hidden">
    {filteredExpenses.length === 0 ? (
     <EmptyState
      icon={Wallet}
      title={expenses.length === 0 ? 'Aucune dépense' : 'Aucun résultat'}
      description={
       expenses.length === 0
        ? 'Enregistrez votre première dépense professionnelle.'
        : 'Aucune dépense ne correspond à vos critères.'
      }
      action={
       expenses.length === 0
        ? { label: 'Nouvelle dépense', onClick: handleCreate }
        : undefined
      }
      secondaryAction={
       expenses.length > 0 && (statusFilter !== 'all' || categoryFilter !== 'all' || search)
        ? {
          label: 'Réinitialiser les filtres',
          onClick: () => {
           setSearch('')
           setStatusFilter('all')
           setCategoryFilter('all')
          },
         }
        : undefined
      }
     />
    ) : (
     <Table>
      <TableHeader className="bg-muted/50">
       <TableRow>
        <TableHead>Date</TableHead>
        <TableHead>Description</TableHead>
        <TableHead className="hidden md:table-cell">Catégorie</TableHead>
        <TableHead>Montant HT</TableHead>
        <TableHead className="hidden md:table-cell">TVA</TableHead>
        <TableHead>Statut</TableHead>
        <TableHead className="w-10"></TableHead>
       </TableRow>
      </TableHeader>
      <TableBody>
       {filteredExpenses.map((expense) => (
        <TableRow key={expense.id} className="group">
         <TableCell className="whitespace-nowrap">
          {new Date(expense.date).toLocaleDateString('fr-FR')}
         </TableCell>
         <TableCell>
          <div className="font-medium">{expense.description}</div>
          {expense.receiptUrl && (
           <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Receipt className="w-3 h-3" />
            Justificatif
           </div>
          )}
         </TableCell>
         <TableCell className="hidden md:table-cell">
          {expense.category ? (
           <span className="inline-flex items-center gap-1.5">
            <span
             className="w-2.5 h-2.5 rounded-full shrink-0"
             style={{ backgroundColor: expense.category.color || '#6B7280' }}
            />
            {expense.category.name}
           </span>
          ) : (
           <span className="text-muted-foreground">—</span>
          )}
         </TableCell>
         <TableCell className="font-medium">
          {formatPrice(expense.amount)}
         </TableCell>
         <TableCell className="hidden md:table-cell text-muted-foreground">
          {formatPrice(expense.vatAmount ?? 0)}
         </TableCell>
         <TableCell>
          <StatusBadge
           status={expense.status || 'pending'}
           statusConfig={EXPENSE_STATUSES}
          />
         </TableCell>
         <TableCell>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {expense.status === 'pending' && (
            <>
             <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              title="Approuver"
              onClick={() => handleStatusChange(expense.id, 'approved')}
              disabled={isPending}
             >
              <CheckCircle className="w-4 h-4" />
             </Button>
            </>
           )}
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Modifier"
            onClick={() => handleEdit(expense)}
           >
            <Pencil className="w-4 h-4" />
           </Button>
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            title="Supprimer"
            onClick={() => handleDelete(expense.id)}
            disabled={isPending}
           >
            <Trash2 className="w-4 h-4" />
           </Button>
          </div>
         </TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    )}
   </div>

   {/* Dialog */}
   <ExpenseDialog
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    expense={editingExpense}
    categories={categories}
    onSuccess={handleSuccess}
   />
  </div>
 )
}
