'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { toast } from 'sonner'

export type Product = {
 id: string
 name: string
 description: string | null
 unitPrice: number // in cents
 currency: string | null
 unit: string | null
 vatRate: number | null
}

interface ProductDialogProps {
 open: boolean
 onOpenChange: (open: boolean) => void
 product?: Product | null
 onSuccess?: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
 const [isPending, startTransition] = useTransition()

 const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
   const result = product
    ? await updateProduct(product.id, formData)
    : await createProduct(formData)

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(product ? 'Produit modifié' : 'Produit créé')
    onOpenChange(false)
    if (onSuccess) onSuccess()
   }
  })
 }

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
     <DialogTitle>
      {product ? 'Modifier le produit' : 'Nouveau produit'}
     </DialogTitle>
    </DialogHeader>

    <form action={handleSubmit} className="space-y-4">
     <div className="space-y-2">
      <Label htmlFor="name">Nom du produit *</Label>
      <Input
       id="name"
       name="name"
       required
       defaultValue={product?.name}
       placeholder="Ex: Consultation SEO"
      />
     </div>

     <div className="space-y-2">
      <Label htmlFor="description">Description (optionnel)</Label>
      <Textarea
       id="description"
       name="description"
       defaultValue={product?.description || ''}
       placeholder="Détails du service ou produit..."
      />
     </div>

     <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
       <Label htmlFor="unitPrice">Prix Unitaire (HT)</Label>
       <div className="relative">
        <Input
         id="unitPrice"
         name="unitPrice"
         type="number"
         step="0.01"
         min="0"
         required
         defaultValue={product ? product.unitPrice / 100 : ''}
         placeholder="0.00"
         className="pr-8"
        />
        <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">€</span>
       </div>
      </div>

      <div className="space-y-2">
       <Label htmlFor="vatRate">TVA (%)</Label>
       <Input
        id="vatRate"
        name="vatRate"
        type="number"
        required
        defaultValue={product?.vatRate ?? 20}
        placeholder="20"
       />
      </div>
     </div>

     <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
       <Label htmlFor="unit">Unité</Label>
       <select
        id="unit"
        name="unit"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        defaultValue={product?.unit || 'unit'}
       >
        <option value="unit">Pièce / Unité</option>
        <option value="hour">Heure</option>
        <option value="day">Jour</option>
        <option value="fixed">Forfait</option>
        <option value="month">Mois</option>
        <option value="year">Année</option>
       </select>
      </div>
     </div>

     <div className="flex justify-end gap-3 pt-4">
      <Button
       type="button"
       variant="outline"
       onClick={() => onOpenChange(false)}
      >
       Annuler
      </Button>
      <Button
       type="submit"
       disabled={isPending}
       
      >
       {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
       {product ? 'Enregistrer' : 'Créer'}
      </Button>
     </div>
    </form>
   </DialogContent>
  </Dialog>
 )
}
