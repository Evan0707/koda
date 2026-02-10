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
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createQuote } from '@/lib/actions/quotes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CURRENCIES, formatPriceFromEuros, getCurrencySymbol } from '@/lib/currency'

type QuoteItem = {
 productId?: string
 description: string
 quantity: number
 unitPrice: number // in euros
 vatRate: number
}

interface QuoteFormProps {
 companies: any[]
 contacts: any[]
 products: any[]
}

export default function QuoteForm({ companies, contacts, products }: QuoteFormProps) {
 const [isPending, startTransition] = useTransition()
 const router = useRouter()

 // Form State
 const [title, setTitle] = useState('')
 const [selectedCompany, setSelectedCompany] = useState<string>('')
 const [selectedContact, setSelectedContact] = useState<string>('')
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
 const [validUntil, setValidUntil] = useState('')
 const [currency, setCurrency] = useState('EUR')

 // Items State
 const [items, setItems] = useState<QuoteItem[]>([
  { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }
 ])

 // Calculation
 const calculateTotals = () => {
  let subtotal = 0
  let vatAmount = 0

  items.forEach(item => {
   const lineTotal = item.quantity * item.unitPrice
   subtotal += lineTotal
   vatAmount += lineTotal * (item.vatRate / 100)
  })

  return {
   subtotal,
   vatAmount,
   total: subtotal + vatAmount
  }
 }

 const totals = calculateTotals()

 const handleAddItem = () => {
  setItems([
   ...items,
   { description: '', quantity: 1, unitPrice: 0, vatRate: 20 }
  ])
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

  const product = products.find(p => p.id === productId)
  if (product) {
   const newItems = [...items]
   newItems[index] = {
    productId: product.id,
    description: product.name + (product.description ? `\n${product.description}` : ''),
    quantity: 1,
    unitPrice: product.unitPrice / 100, // convert back to euros for display
    vatRate: product.vatRate || 20
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
   const result = await createQuote({
    title,
    companyId: selectedCompany || null,
    contactId: selectedContact || null,
    issueDate,
    validUntil,
    status: 'draft',
    items: items
   })

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Devis créé avec succès')
    router.push(`/dashboard/quotes/${result.id}`)
   }
  })
 }

 return (
  <div className="max-w-5xl mx-auto space-y-6 pb-20">
   {/* Header */}
   <div className="flex items-center gap-4 mb-6">
    <Link
     href="/dashboard/quotes"
     className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
    </Link>
    <div className="flex-1">
     <h1 className="text-2xl font-bold text-gray-900">Nouveau Devis</h1>
    </div>
    <Button onClick={handleSubmit} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
     {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
     Enregistrer le brouillon
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
        <Label>Date d'émission</Label>
        <Input
         type="date"
         value={issueDate}
         onChange={(e) => setIssueDate(e.target.value)}
        />
       </div>
       <div className="space-y-2">
        <Label>Validité jusqu'au</Label>
        <Input
         type="date"
         value={validUntil}
         onChange={(e) => setValidUntil(e.target.value)}
        />
       </div>
      </div>

      <div className="space-y-2">
       <Label>Devise</Label>
       <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
       >
        {CURRENCIES.map((c) => (
         <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
        ))}
       </select>
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
       <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        value={selectedCompany}
        onChange={(e) => {
         setSelectedCompany(e.target.value);
         if (e.target.value) setSelectedContact(''); // Clear contact if company selected (simplification)
        }}
       >
        <option value="">Sélectionner une entreprise...</option>
        {companies.map((c: any) => (
         <option key={c.id} value={c.id}>{c.name}</option>
        ))}
       </select>
      </div>

      <div className="relative">
       <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
       </div>
       <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-muted-foreground">Ou</span>
       </div>
      </div>

      <div className="space-y-2">
       <Label>Contact Particulier</Label>
       <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        value={selectedContact}
        onChange={(e) => {
         setSelectedContact(e.target.value);
         if (e.target.value) setSelectedCompany('');
        }}
       >
        <option value="">Sélectionner un contact...</option>
        {contacts.filter((c: any) => !c.companyId).map((c: any) => (
         <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
        ))}
       </select>
      </div>
     </CardContent>
    </Card>

    {/* Line Items - Full Width */}
    <Card className="lg:col-span-3">
     <CardHeader>
      <CardTitle>Lignes du devis</CardTitle>
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
       <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
         <tr>
          <th className="px-4 py-2 text-left w-1/3">Description</th>
          <th className="px-4 py-2 w-24">Qté</th>
          <th className="px-4 py-2 w-32">Prix U. HT</th>
          <th className="px-4 py-2 w-20">TVA %</th>
          <th className="px-4 py-2 w-32 text-right">Total HT</th>
          <th className="px-4 py-2 w-10"></th>
         </tr>
        </thead>
        <tbody className="divide-y">
         {items.map((item, index) => (
          <tr key={index} className="group">
           <td className="p-2 align-top">
            <div className="space-y-2">
             <select
              className="w-full text-xs text-gray-500 border-none bg-transparent focus:ring-0 mb-1"
              value={item.productId || ''}
              onChange={(e) => handleProductSelect(index, e.target.value)}
             >
              <option value="">Sélectionner un produit (optionnel)...</option>
              {products.map((p: any) => (
               <option key={p.id} value={p.id}>{p.name} - {p.unitPrice / 100}€</option>
              ))}
             </select>
             <Textarea
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="Description de la prestation..."
              className="min-h-[60px]"
             />
            </div>
           </td>
           <td className="p-2 align-top">
            <Input
             type="number"
             min="1"
             value={item.quantity}
             onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
            />
           </td>
           <td className="p-2 align-top">
            <Input
             type="number"
             min="0"
             step="0.01"
             value={item.unitPrice}
             onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
            />
           </td>
           <td className="p-2 align-top">
            <Input
             type="number"
             min="0"
             value={item.vatRate}
             onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value))}
            />
           </td>
           <td className="p-2 align-top text-right font-medium pt-3">
            {(item.quantity * item.unitPrice).toFixed(2)} €
           </td>
           <td className="p-2 align-top pt-3">
            <button
             onClick={() => handleRemoveItem(index)}
             className="text-gray-400 hover:text-red-600 transition-colors"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>

      <Button variant="outline" onClick={handleAddItem} className="w-full border-dashed">
       <Plus className="w-4 h-4 mr-2" />
       Ajouter une ligne vide
      </Button>

      <div className="flex justify-end pt-4">
       <div className="w-64 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
         <span>Total HT</span>
         <span>{totals.subtotal.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
         <span>TVA</span>
         <span>{totals.vatAmount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t text-gray-900">
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
