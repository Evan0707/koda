'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from '@/components/ui/dialog'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
 createExpense,
 updateExpense,
 createExpenseCategory,
 type ExpenseWithRelations,
 type ExpenseFormData,
} from '@/lib/actions/expenses'
import type { ExpenseCategory } from '@/types/db'

interface ExpenseDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 expense: ExpenseWithRelations | null
 categories: ExpenseCategory[]
 onSuccess: () => void
}

export function ExpenseDialog({
 open,
 onOpenChange,
 expense,
 categories,
 onSuccess,
}: ExpenseDialogProps) {
 const isEditing = !!expense
 const [isPending, startTransition] = useTransition()
 const [showNewCategory, setShowNewCategory] = useState(false)
 const [newCategoryName, setNewCategoryName] = useState('')
 const [localCategories, setLocalCategories] = useState(categories)

 // Form state
 const [description, setDescription] = useState(expense?.description || '')
 const [amount, setAmount] = useState(expense ? (expense.amount / 100).toString() : '')
 const [categoryId, setCategoryId] = useState(expense?.categoryId || '')
 const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0])
 const [vatRate, setVatRate] = useState(expense?.vatRate?.toString() || '20')
 const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
  (expense?.status as 'pending' | 'approved' | 'rejected') || 'pending'
 )

 // Reset form when dialog opens/closes or expense changes
 const handleOpenChange = (open: boolean) => {
  if (open) {
   setDescription(expense?.description || '')
   setAmount(expense ? (expense.amount / 100).toString() : '')
   setCategoryId(expense?.categoryId || '')
   setDate(expense?.date || new Date().toISOString().split('T')[0])
   setVatRate(expense?.vatRate?.toString() || '20')
   setStatus((expense?.status as 'pending' | 'approved' | 'rejected') || 'pending')
   setShowNewCategory(false)
   setNewCategoryName('')
   setLocalCategories(categories)
  }
  onOpenChange(open)
 }

 const handleCreateCategory = () => {
  if (!newCategoryName.trim()) return

  startTransition(async () => {
   const result = await createExpenseCategory({ name: newCategoryName.trim(), color: '#6B7280' })
   if (result.error) {
    toast.error(result.error)
   } else if (result.category) {
    setLocalCategories(prev => [...prev, result.category!])
    setCategoryId(result.category.id)
    setNewCategoryName('')
    setShowNewCategory(false)
    toast.success('Catégorie créée')
   }
  })
 }

 const handleSubmit = () => {
  if (!description.trim()) {
   toast.error('La description est requise')
   return
  }
  if (!amount || parseFloat(amount) <= 0) {
   toast.error('Le montant est requis')
   return
  }
  if (!date) {
   toast.error('La date est requise')
   return
  }

  const data: ExpenseFormData = {
   description: description.trim(),
   amount: parseFloat(amount),
   categoryId: categoryId || null,
   date,
   vatRate: parseInt(vatRate) || 20,
   status,
  }

  startTransition(async () => {
   const result = isEditing
    ? await updateExpense(expense.id, data)
    : await createExpense(data)

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(isEditing ? 'Dépense modifiée' : 'Dépense créée')
    onOpenChange(false)
    onSuccess()
   }
  })
 }

 const vatAmount = amount ? (parseFloat(amount) * (parseInt(vatRate) || 0)) / 100 : 0
 const ttc = amount ? parseFloat(amount) + vatAmount : 0

 return (
  <Dialog open={open} onOpenChange={handleOpenChange}>
   <DialogContent className="max-w-md">
    <DialogHeader>
     <DialogTitle>
      {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
     </DialogTitle>
    </DialogHeader>

    <div className="space-y-4 py-2">
     {/* Description */}
     <div className="space-y-2">
      <Label htmlFor="description">Description *</Label>
      <Input
       id="description"
       value={description}
       onChange={(e) => setDescription(e.target.value)}
       placeholder="ex: Abonnement logiciel, Déplacement client..."
      />
     </div>

     {/* Amount + VAT Rate */}
     <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
       <Label htmlFor="amount">Montant HT (€) *</Label>
       <Input
        id="amount"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
       />
      </div>
      <div className="space-y-2">
       <Label htmlFor="vatRate">Taux TVA (%)</Label>
       <Select value={vatRate} onValueChange={setVatRate}>
        <SelectTrigger id="vatRate">
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="0">0%</SelectItem>
         <SelectItem value="5">5,5%</SelectItem>
         <SelectItem value="10">10%</SelectItem>
         <SelectItem value="20">20%</SelectItem>
        </SelectContent>
       </Select>
      </div>
     </div>

     {/* Amount preview */}
     {amount && parseFloat(amount) > 0 && (
      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
       <div className="flex justify-between">
        <span>TVA ({vatRate}%)</span>
        <span>{vatAmount.toFixed(2)} €</span>
       </div>
       <div className="flex justify-between font-medium text-foreground">
        <span>Total TTC</span>
        <span>{ttc.toFixed(2)} €</span>
       </div>
      </div>
     )}

     {/* Date */}
     <div className="space-y-2">
      <Label htmlFor="date">Date *</Label>
      <Input
       id="date"
       type="date"
       value={date}
       onChange={(e) => setDate(e.target.value)}
      />
     </div>

     {/* Category */}
     <div className="space-y-2">
      <Label>Catégorie</Label>
      {showNewCategory ? (
       <div className="flex gap-2">
        <Input
         value={newCategoryName}
         onChange={(e) => setNewCategoryName(e.target.value)}
         placeholder="Nom de la catégorie"
         onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
        />
        <Button
         size="sm"
         onClick={handleCreateCategory}
         disabled={isPending || !newCategoryName.trim()}
        >
         {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
        </Button>
        <Button
         size="sm"
         variant="ghost"
         onClick={() => setShowNewCategory(false)}
        >
         ✕
        </Button>
       </div>
      ) : (
       <div className="flex gap-2">
        <Select value={categoryId} onValueChange={setCategoryId}>
         <SelectTrigger className="flex-1">
          <SelectValue placeholder="Sélectionner une catégorie" />
         </SelectTrigger>
         <SelectContent>
          {localCategories.map((cat) => (
           <SelectItem key={cat.id} value={cat.id}>
            <span className="flex items-center gap-2">
             <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: cat.color || '#6B7280' }}
             />
             {cat.name}
            </span>
           </SelectItem>
          ))}
         </SelectContent>
        </Select>
        <Button
         size="icon"
         variant="outline"
         title="Nouvelle catégorie"
         onClick={() => setShowNewCategory(true)}
        >
         <Plus className="w-4 h-4" />
        </Button>
       </div>
      )}
     </div>

     {/* Status */}
     <div className="space-y-2">
      <Label>Statut</Label>
      <Select value={status} onValueChange={(v) => setStatus(v as 'pending' | 'approved' | 'rejected')}>
       <SelectTrigger>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="pending">En attente</SelectItem>
        <SelectItem value="approved">Approuvée</SelectItem>
        <SelectItem value="rejected">Rejetée</SelectItem>
       </SelectContent>
      </Select>
     </div>
    </div>

    <DialogFooter>
     <Button variant="outline" onClick={() => onOpenChange(false)}>
      Annuler
     </Button>
     <Button onClick={handleSubmit} disabled={isPending}>
      {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isEditing ? 'Enregistrer' : 'Créer'}
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 )
}
