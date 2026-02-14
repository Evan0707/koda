import { CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

async function verifyAndMarkPaid(invoiceId: string, sessionId: string) {
 'use server'

 try {
  // Get invoice with organization
  const invoice = await db.query.invoices.findFirst({
   where: eq(schema.invoices.id, invoiceId),
   with: { organization: true }
  })

  if (!invoice || invoice.status === 'paid') {
   return // Already paid or not found
  }

  if (!invoice.organization?.stripeSecretKey) {
   return // No Stripe configured
  }

  // Verify with Stripe that payment was successful
  const stripe = new Stripe(invoice.organization.stripeSecretKey, {
   apiVersion: '2025-03-31.basil' as any,
  })

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status === 'paid') {
   // Mark invoice as paid
   await db.update(schema.invoices)
    .set({
     status: 'paid',
     paidAt: new Date(),
     updatedAt: new Date(),
    })
    .where(eq(schema.invoices.id, invoiceId))

   // Create payment record if not exists
   const existingPayment = await db.query.payments.findFirst({
    where: eq(schema.payments.reference, sessionId)
   })

   if (!existingPayment) {
    await db.insert(schema.payments).values({
     organizationId: invoice.organizationId,
     invoiceId: invoice.id,
     amount: invoice.total ?? 0,
     paidAt: new Date(),
     method: 'stripe',
     reference: sessionId,
    })
   }

   console.log(`✅ Invoice ${invoice.number} marked as paid via success page fallback`)
  }
 } catch (error) {
  console.error('Error verifying payment:', error)
 }
}

export default async function PaymentSuccessPage({
 params,
 searchParams,
}: {
 params: Promise<{ invoiceId: string }>
 searchParams: Promise<{ session_id?: string }>
}) {
 const { invoiceId } = await params
 const { session_id } = await searchParams

 // Verify payment and mark as paid (fallback if webhook didn't fire)
 if (typeof session_id === 'string') {
  await verifyAndMarkPaid(invoiceId, session_id)
 }

 return (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/20 flex items-center justify-center p-4">
   <Card className="max-w-lg w-full">
    <CardContent className="pt-10 pb-8 text-center">
     {/* Success Icon */}
     <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
     </div>

     {/* Title */}
     <h1 className="text-3xl font-bold text-foreground mb-3">
      Paiement réussi ! 🎉
     </h1>

     {/* Message */}
     <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
      Merci pour votre règlement. Un email de confirmation vous a été envoyé.
     </p>

     {/* Amount confirmation */}
     <div className="bg-muted rounded-lg p-6 mb-8">
      <p className="text-sm text-muted-foreground mb-1">Référence</p>
      <p className="text-lg font-mono text-foreground">{invoiceId.slice(0, 8).toUpperCase()}</p>
     </div>

     {/* Actions */}
     <div className="space-y-3">
      <Button
       asChild
       variant="outline"
       className="w-full"
      >
       <Link href={`/pay/${invoiceId}`}>
        <Download className="w-4 h-4 mr-2" />
        Voir la facture
       </Link>
      </Button>

      <p className="text-sm text-muted-foreground">
       Vous pouvez fermer cette page en toute sécurité.
      </p>
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
