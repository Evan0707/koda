'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
 CheckCircle,
 CreditCard,
 FileText,
 Loader2,
 Lock,
 Calendar,
 Building2,
 Mail,
} from 'lucide-react'
import { createCheckoutSession } from '@/lib/actions/stripe'
import { cn } from '@/lib/utils'
import type { PublicInvoice } from '@/types/db'

const formatCurrency = (cents: number) =>
 new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
 }).format(cents / 100)

const formatDate = (date: Date | null) => {
 if (!date) return '-'
 return new Date(date).toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
 })
}

export default function PaymentClient({
 invoice,
 hasStripe,
 alreadyPaid,
}: {
 invoice: PublicInvoice | null
 hasStripe: boolean
 alreadyPaid: boolean
}) {
 const [isPending, startTransition] = useTransition()
 const [error, setError] = useState<string | null>(null)

 const handlePayment = () => {
  if (!invoice) return

  startTransition(async () => {
   setError(null)
   const result = await createCheckoutSession(invoice.id)

   if (result.error) {
    setError(result.error)
   } else if (result.url) {
    window.location.href = result.url
   }
  })
 }

 // Already paid state
 if (alreadyPaid) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 flex items-center justify-center p-4">
    <Card className="max-w-md w-full text-center">
     <CardContent className="pt-10 pb-8">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
       <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
       Facture déjà réglée
      </h1>
      <p className="text-muted-foreground">
       Cette facture a déjà été payée. Merci pour votre règlement !
      </p>
     </CardContent>
    </Card>
   </div>
  )
 }

 // Error or no invoice
 if (!invoice) {
  return (
   <div className="min-h-screen bg-muted flex items-center justify-center p-4">
    <Card className="max-w-md w-full text-center">
     <CardContent className="pt-10 pb-8">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
       <FileText className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
       Facture introuvable
      </h1>
      <p className="text-muted-foreground">
       Cette facture n'existe pas ou n'est plus disponible.
      </p>
     </CardContent>
    </Card>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-background dark:via-background dark:to-background">
   {/* Header */}
   <header className="bg-card border-b border-border sticky top-0 z-10">
    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
     <div className="flex items-center gap-3">
      {invoice.organization.logoUrl ? (
       <img
        src={invoice.organization.logoUrl}
        alt={invoice.organization.name}
        className="h-8 w-auto"
       />
      ) : (
       <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <span className="text-primary-foreground font-bold text-sm">
         {invoice.organization.name.charAt(0)}
        </span>
       </div>
      )}
      <span className="font-semibold text-foreground">
       {invoice.organization.name}
      </span>
     </div>
     <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Lock className="w-4 h-4" />
      Paiement sécurisé
     </div>
    </div>
   </header>

   {/* Main Content */}
   <main className="max-w-4xl mx-auto px-4 py-8">
    <div className="grid lg:grid-cols-3 gap-8">
     {/* Invoice Details */}
     <div className="lg:col-span-2 space-y-6">
      {/* Invoice Header */}
      <Card>
       <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
         <div>
          <CardTitle className="text-2xl flex items-center gap-2 text-foreground">
           <FileText className="w-6 h-6 text-primary" />
           Facture {invoice.number}
          </CardTitle>
          <p className="text-muted-foreground mt-1">
           Émise le {formatDate(invoice.issueDate)}
          </p>
         </div>
         <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30">
          En attente
         </Badge>
        </div>
       </CardHeader>
       <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
         {/* Billed To */}
         <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
           <Mail className="w-4 h-4" />
           Facturé à
          </p>
          <p className="font-medium text-foreground">{invoice.contact?.name}</p>
          {invoice.contact?.companyName && (
           <p className="text-muted-foreground">{invoice.contact.companyName}</p>
          )}
          {invoice.contact?.email && (
           <p className="text-muted-foreground text-sm">{invoice.contact.email}</p>
          )}
         </div>

         {/* From */}
         <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
           <Building2 className="w-4 h-4" />
           De
          </p>
          <p className="font-medium text-foreground">{invoice.organization.name}</p>
          {invoice.organization.address && (
           <p className="text-muted-foreground text-sm">
            {invoice.organization.address}
            {invoice.organization.city && `, ${invoice.organization.city}`}
           </p>
          )}
          {invoice.organization.siret && (
           <p className="text-muted-foreground text-sm">SIRET: {invoice.organization.siret}</p>
          )}
         </div>
        </div>
       </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
       <CardHeader>
        <CardTitle className="text-lg text-foreground">Détail de la facture</CardTitle>
       </CardHeader>
       <CardContent>
        <div className="space-y-3">
         {invoice.items.map((item, index) => (
          <div
           key={index}
           className="flex justify-between items-center py-3 border-b border-border last:border-0"
          >
           <div className="flex-1">
            <p className="font-medium text-foreground">{item.description || 'Article'}</p>
            <p className="text-sm text-muted-foreground">
             {item.quantity} × {formatCurrency(item.unitPrice)}
            </p>
           </div>
           <p className="font-medium text-foreground">{formatCurrency(item.total)}</p>
          </div>
         ))}
        </div>

        {/* Totals */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
         <div className="flex justify-between text-muted-foreground">
          <span>Sous-total HT</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
         </div>
         <div className="flex justify-between text-muted-foreground">
          <span>TVA</span>
          <span>{formatCurrency(invoice.vatAmount)}</span>
         </div>
         <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
          <span>Total TTC</span>
          <span className="text-primary">{formatCurrency(invoice.total)}</span>
         </div>
        </div>
       </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
       <Card>
        <CardContent className="pt-6">
         <p className="text-sm text-muted-foreground">{invoice.notes}</p>
        </CardContent>
       </Card>
      )}
     </div>

     {/* Payment Panel */}
     <div className="lg:col-span-1">
      <div className="sticky top-24">
       <Card className="border-2 border-indigo-100 dark:border-indigo-900/30 bg-gradient-to-br from-white to-indigo-50/30 dark:from-card dark:to-indigo-950/20">
        <CardHeader>
         <CardTitle className="text-center text-foreground">Régler cette facture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
         {/* Amount */}
         <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Montant à payer</p>
          <p className="text-4xl font-bold text-primary">
           {formatCurrency(invoice.total)}
          </p>
         </div>

         {/* Due Date */}
         {invoice.dueDate && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
           <Calendar className="w-4 h-4" />
           Échéance : {formatDate(invoice.dueDate)}
          </div>
         )}

         {/* Error Message */}
         {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 text-sm text-center">
           {error}
          </div>
         )}

         {/* Pay Button */}
         {hasStripe ? (
          <Button
           onClick={handlePayment}
           disabled={isPending}
           className="w-full h-12 text-lg"
          >
           {isPending ? (
            <>
             <Loader2 className="w-5 h-5 animate-spin mr-2" />
             Redirection...
            </>
           ) : (
            <>
             <CreditCard className="w-5 h-5 mr-2" />
             Payer maintenant
            </>
           )}
          </Button>
         ) : (
          <div className="text-center text-muted-foreground text-sm">
           Le paiement en ligne n'est pas encore configuré.
           Veuillez contacter le fournisseur.
          </div>
         )}

         {/* Security Notice */}
         <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <Lock className="w-3 h-3" />
          <span>Paiement sécurisé par Stripe</span>
         </div>

         {/* Payment Methods */}
         <div className="flex justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
          <img src="https://img.icons8.com/color/48/visa.png" alt="Visa" className="h-6" />
          <img src="https://img.icons8.com/color/48/mastercard-logo.png" alt="Mastercard" className="h-6" />
          <img src="https://img.icons8.com/color/48/amex.png" alt="Amex" className="h-6" />
         </div>
        </CardContent>
       </Card>
      </div>
     </div>
    </div>
   </main>

   {/* Footer */}
   <footer className="border-t border-border mt-16 py-8 text-center text-sm text-muted-foreground">
    <p>
     © {new Date().getFullYear()} {invoice.organization.name}. Tous droits réservés.
    </p>
   </footer>
  </div>
 )
}
