'use client'

import { useEffect, useState, useTransition } from 'react'
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
import { createInvoice } from '@/lib/actions/invoices'
import { type CreateInvoiceInput } from '@/lib/schemas/billing'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { LimitReachedModal } from '@/components/limit-reached-modal'
import { CURRENCIES } from '@/lib/currency'

type InvoiceLineItem = {
 productId?: string
 description: string
 quantity: number
 unitPrice: number // in euros
 vatRate: number
}

interface InvoiceFormProps {
 companies: any[]
 contacts: any[]
 products: any[]
 projects: any[]
}

export default function InvoiceForm({ companies, contacts, products, projects }: InvoiceFormProps) {
 const [isPending, startTransition] = useTransition()
 const router = useRouter()

 const [showLimitModal, setShowLimitModal] = useState(false)
 const [currentPlan, setCurrentPlan] = useState('free')

 // Form state
 const [title, setTitle] = useState('')
 const [selectedCompany, setSelectedCompany] = useState<string>('')
 const [selectedContact, setSelectedContact] = useState<string>('')
 const [selectedProject, setSelectedProject] = useState<string>('')
 const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
 const [dueDate, setDueDate] = useState(() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
 })
 const [currency, setCurrency] = useState('EUR')
 const [invoiceType, setInvoiceType] = useState<'invoice' | 'deposit' | 'credit_note'>('invoice')
 const [notes, setNotes] = useState('')

 // Items
 const [items, setItems] = useState<InvoiceLineItem[]>([
  { description: '', quantity: 1, unitPrice: 0, vatRate: 20 },
 ])

 // Totals
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

 const updateItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
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
  if (items.length === 0 || items.every((i) => !i.description)) {
   toast.error('Ajoutez au moins une ligne à la facture')
   return
  }

  startTransition(async () => {
   const invoiceData: CreateInvoiceInput = {
    title: title || undefined,
    companyId: selectedCompany || null,
    contactId: selectedContact || null,
    projectId: selectedProject || null,
    issueDate,
    dueDate,
    currency,
    type: invoiceType,
    notes: notes || undefined,
    items: items.map((item) => ({
     ...item,
     productId: item.productId || undefined,
    })),
   }

   const result = await createInvoice(invoiceData)

   if (result.error) {
    if ('upgradeRequired' in result && result.upgradeRequired) {
     setCurrentPlan(result.currentPlan || 'free')
     setShowLimitModal(true)
    } else {
     toast.error(result.error)
    }
   } else {
    toast.success('Facture créée avec succès')
    router.push(`/dashboard/invoices/${result.id}`)
   }
  })
 }

 // Filter projects by selected company 
 const filteredProjects = selectedCompany
  ? projects.filter((p: any) => p.companyId === selectedCompany || !p.companyId)
  : projects

 return (
  <div className="max-w-5xl mx-auto space-y-6 pb-20">
   {/* Header */}
   <div className="flex items-center gap-4 mb-6">
    <Link
     href="/dashboard/invoices"
     className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
    </Link>
    <div className="flex-1">
     <h1 className="text-2xl font-bold text-primary">Nouvelle Facture</h1>
    </div>
    <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/80">
     {isPending ? (
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
     ) : (
      <Save className="w-4 h-4 mr-2" />
     )}
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
       <Label>Titre de la facture (optionnel)</Label>
       <Input
        placeholder="Ex: Développement Site Web - Mars 2026"
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
        <Label>Date d&apos;échéance</Label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
       <div className="space-y-2">
        <Label>Type</Label>
        <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as any)}>
         <SelectTrigger>
          <SelectValue />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="invoice">Facture</SelectItem>
          <SelectItem value="deposit">Acompte</SelectItem>
          <SelectItem value="credit_note">Avoir</SelectItem>
         </SelectContent>
        </Select>
       </div>
      </div>

      <div className="space-y-2">
       <Label>Notes (optionnel)</Label>
       <Textarea
        placeholder="Conditions de paiement, mentions légales..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
       />
      </div>
     </CardContent>
    </Card>

    {/* Client + Project Selection */}
    <Card>
     <CardHeader>
      <CardTitle>Client & Projet</CardTitle>
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-2">
       <Label>Entreprise</Label>
       <Select
        value={selectedCompany}
        onValueChange={(value) => {
         if (value === '__create_company__') {
          router.push('/dashboard/contacts?tab=companies')
          return
         }
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
         <Separator className="my-1" />
         <SelectItem value="__create_company__" className="text-primary font-medium">
          + Créer une entreprise
         </SelectItem>
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
         if (value === '__create_contact__') {
          router.push('/dashboard/contacts')
          return
         }
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
         <Separator className="my-1" />
         <SelectItem value="__create_contact__" className="text-primary font-medium">
          + Créer un contact
         </SelectItem>
        </SelectContent>
       </Select>
      </div>

      <Separator />

      <div className="space-y-2">
       <Label>Projet (optionnel)</Label>
       <Select
        value={selectedProject}
        onValueChange={(value) => setSelectedProject(value === '__none__' ? '' : value)}
       >
        <SelectTrigger className="w-full">
         <SelectValue placeholder="Associer à un projet..." />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="__none__">Aucun projet</SelectItem>
         <Separator className="my-1" />
         {filteredProjects.map((p: any) => (
          <SelectItem key={p.id} value={p.id}>
           {p.name}
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
      <CardTitle>Lignes de facturation</CardTitle>
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
       Ajouter une ligne
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

   <LimitReachedModal
    isOpen={showLimitModal}
    onClose={() => setShowLimitModal(false)}
    currentPlan={currentPlan}
    limitType="invoices"
   />
  </div>
 )
}
