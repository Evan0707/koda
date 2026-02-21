'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { updateQuote } from '@/lib/actions/quotes'
import { type CreateQuoteInput } from '@/lib/schemas/billing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CURRENCIES } from '@/lib/currency'
import type { QuoteWithDetails } from '@/types/db'

type QuoteItem = {
 productId?: string
 description: string
 quantity: number
 unitPrice: number // in euros
 vatRate: number
}

interface QuoteEditFormProps {
 quote: QuoteWithDetails
 companies: any[]
 contacts: any[]
 products: any[]
}

export default function QuoteEditForm({ quote, companies, contacts, products }: QuoteEditFormProps) {
 const [isPending, startTransition] = useTransition()
 const router = useRouter()

 // Pre-populate from existing quote
 const [title, setTitle] = useState(quote.title || '')
 const [selectedCompany, setSelectedCompany] = useState<string>(quote.companyId || '')
 const [selectedContact, setSelectedContact] = useState<string>(quote.contactId || '')
 const [issueDate, setIssueDate] = useState(
  quote.issueDate ? new Date(quote.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
 )
 const [validUntil, setValidUntil] = useState(
  quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : ''
 )
 const [currency, setCurrency] = useState(quote.currency || 'EUR')

 // Pre-populate items (convert cents back to euros for display)
 const [items, setItems] = useState<QuoteItem[]>(
  quote.items.length > 0
   ? quote.items.map((item) => ({
     productId: item.productId || undefined,
     description: item.description,
     quantity: item.quantity || 1,
     unitPrice: (item.unitPrice || 0) / 100,
     vatRate: item.vatRate || 20,
    }))
   : [{ description: '', quantity: 1, unitPrice: 0, vatRate: 20 }]
 )

 // Calculation
 const calculateTotals = () => {
  let subtotal = 0
  let vatAmount = 0
  items.forEach((item) => {
   const lineTotal = item.quantity * item.unitPrice
   subtotal += lineTotal
   vatAmount += lineTotal * (item.vatRate / 100)
  })
  return { subtotal, vatAmount, total: subtotal + vatAmount }
 }
 const totals = calculateTotals()

 const handleAddItem = () => {
  setItems([...items, { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }])
 }

 const handleRemoveItem = (index: number) => {
  setItems(items.filter((_, i) => i !== index))
 }

 const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
  const newItems = [...items]
  newItems[index] = { ...newItems[index], [field]: value }
  setItems(newItems)
 }

 const handleProductSelect = (index: number, productId: string) => {
  if (!productId) return
  const product = products.find((p: any) => p.id === productId)
  if (product) {
   const newItems = [...items]
   newItems[index] = {
    productId: product.id,
    description: product.name + (product.description ? `\n${product.description}` : ''),
    quantity: 1,
    unitPrice: product.unitPrice / 100,
    vatRate: product.vatRate || 20,
   }
   setItems(newItems)
  }
 }

 const handleSubmit = async () => {
  if (!selectedCompany && !selectedContact) {
   toast.error('Veuillez sélectionner un client (Entreprise ou Contact)')
   return
  }
  if (items.length === 0) {
   toast.error('Ajoutez au moins une ligne au devis')
   return
  }

  startTransition(async () => {
   const quoteData: CreateQuoteInput = {
    title: title || undefined,
    companyId: selectedCompany || null,
    contactId: selectedContact || null,
    issueDate,
    validUntil: validUntil || undefined,
    status: 'draft',
    currency,
    items: items.map((item) => ({
     ...item,
     productId: item.productId || undefined,
    })),
   }

   const result = await updateQuote(quote.id, quoteData)

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Devis modifié avec succès')
    router.push(`/dashboard/quotes/${quote.id}`)
   }
  })
 }

 return (
  <div className="max-w-5xl mx-auto space-y-6 pb-20">
   {/* Header */}
   <div className="flex items-center gap-4 mb-6">
    <Link
     href={`/dashboard/quotes/${quote.id}`}
     className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
    </Link>
    <div className="flex-1">
     <h1 className="text-2xl font-bold text-primary">Modifier le devis</h1>
     <p className="text-sm text-muted-foreground">{quote.number}</p>
    </div>
    <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/80">
     {isPending ? (
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
     ) : (
      <Save className="w-4 h-4 mr-2" />
     )}
     Enregistrer les modifications
    </Button>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Main Info */}
    <Card className="lg:col-span-2">
     <CardHeader>
      <CardTitle>Informations</CardTitle>
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-2">
       <Label>Titre du devis (optionnel)</Label>
       <Input
        placeholder="Ex: Refonte Site Web - ACME"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label>Date d&apos;émission</Label>
        <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
       </div>
       <div className="space-y-2">
        <Label>Validité jusqu&apos;au</Label>
        <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
       </div>
      </div>

      <div className="space-y-2">
       <Label>Devise</Label>
       <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger>
         <SelectValue />
        </SelectTrigger>
        <SelectContent>
         {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
           {c.symbol} - {c.name}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>
     </CardContent>
    </Card>

    {/* Client Selection */}
    <Card>
     <CardHeader>
      <CardTitle>Client</CardTitle>
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-2">
       <Label>Entreprise</Label>
       <Select
        value={selectedCompany}
        onValueChange={(value) => {
         setSelectedCompany(value)
         if (value) setSelectedContact('')
        }}
       >
        <SelectTrigger className="w-full">
         <SelectValue placeholder="Sélectionner une entreprise..." />
        </SelectTrigger>
        <SelectContent>
         {companies.map((c: any) => (
          <SelectItem key={c.id} value={c.id}>
           {c.name}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </div>

      <div className="relative">
       <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
       </div>
       <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">Ou</span>
       </div>
      </div>

      <div className="space-y-2">
       <Label>Contact Particulier</Label>
       <Select
        value={selectedContact}
        onValueChange={(value) => {
         setSelectedContact(value)
         if (value) setSelectedCompany('')
        }}
       >
        <SelectTrigger className="w-full">
         <SelectValue placeholder="Sélectionner un contact..." />
        </SelectTrigger>
        <SelectContent>
         {contacts
          .filter((c: any) => !c.companyId)
          .map((c: any) => (
           <SelectItem key={c.id} value={c.id}>
            {c.firstName} {c.lastName}
           </SelectItem>
          ))}
        </SelectContent>
       </Select>
      </div>
     </CardContent>
    </Card>

    {/* Line Items */}
    <Card className="lg:col-span-3">
     <CardHeader>
      <CardTitle>Lignes du devis</CardTitle>
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-3">
       {items.map((item, index) => (
        <div key={index} className="rounded-lg border p-4 space-y-3">
         <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
           <Label className="text-primary">Produit (optionnel)</Label>
           <Select
            value={item.productId || ''}
            onValueChange={(value) => handleProductSelect(index, value)}
           >
            <SelectTrigger className="h-9">
             <SelectValue placeholder="Sélectionner un produit préconfiguré..." />
            </SelectTrigger>
            <SelectContent>
             {products.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
               {p.name} - {(p.unitPrice / 100).toFixed(2)} €
              </SelectItem>
             ))}
            </SelectContent>
           </Select>
          </div>
          <button
           onClick={() => handleRemoveItem(index)}
           className="text-muted-foreground hover:text-red-600 transition-colors p-1 mt-5"
           disabled={items.length === 1}
          >
           <Trash2 className="w-4 h-4" />
          </button>
         </div>

         <div className="space-y-2">
          <Label className="text-primary">Description</Label>
          <Textarea
           value={item.description}
           onChange={(e) => updateItem(index, 'description', e.target.value)}
           placeholder="Description détaillée de la prestation..."
           className="min-h-[80px] resize-none"
          />
         </div>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
           <Label className="text-primary">Quantité</Label>
           <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
            className="h-9"
           />
          </div>
          <div className="space-y-1.5">
           <Label className="text-primary">Prix U. HT (€)</Label>
           <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
            className="h-9"
           />
          </div>
          <div className="space-y-1.5">
           <Label className="text-primary">TVA (%)</Label>
           <Input
            type="number"
            min="0"
            value={item.vatRate}
            onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
            className="h-9"
           />
          </div>
          <div className="space-y-1.5">
           <Label className="text-primary">Total HT</Label>
           <div className="h-9 flex items-center justify-end font-semibold text-foreground bg-muted rounded-md px-3 border">
            {(item.quantity * item.unitPrice).toFixed(2)} €
           </div>
          </div>
         </div>
        </div>
       ))}
      </div>

      <Button variant="outline" onClick={handleAddItem} className="w-full border-dashed">
       <Plus className="w-4 h-4 mr-2" />
       Ajouter une ligne vide
      </Button>

      <div className="flex justify-end pt-4">
       <div className="w-64 space-y-2">
        <div className="flex justify-between text-sm text-primary">
         <span>Total HT</span>
         <span>{totals.subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm text-primary">
         <span>TVA</span>
         <span>{totals.vatAmount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t text-primary">
         <span>Total TTC</span>
         <span>{totals.total.toFixed(2)} €</span>
        </div>
       </div>
      </div>
     </CardContent>
    </Card>
   </div>
  </div>
 )
}
