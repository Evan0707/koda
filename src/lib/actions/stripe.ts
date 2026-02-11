'use server'

import { db, schema } from '@/db'
import { eq, isNull, and } from 'drizzle-orm'
import Stripe from 'stripe'
import { revalidatePath } from 'next/cache'

// Get invoice for public payment page (no auth required)
export async function getPublicInvoice(invoiceId: string) {
 try {
  const invoice = await db.query.invoices.findFirst({
   where: and(
    eq(schema.invoices.id, invoiceId),
    isNull(schema.invoices.deletedAt)
   ),
   with: {
    contact: true,
    company: true,
    items: true,
    organization: {
     columns: {
      name: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
      siret: true,
      vatNumber: true,
      logoUrl: true,
      stripePublishableKey: true,
      stripeSecretKey: true,
     }
    }
   }
  })

  if (!invoice) {
   return { error: 'Facture introuvable' }
  }

  // Check if already paid
  if (invoice.status === 'paid') {
   return { error: 'Cette facture a déjà été réglée', alreadyPaid: true }
  }

  // Check if Stripe is configured
  const hasStripe = !!invoice.organization?.stripeSecretKey

  return {
   invoice: {
    id: invoice.id,
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    notes: invoice.notes,
    items: invoice.items.map(item => ({
     description: item.description,
     quantity: Number(item.quantity),
     unitPrice: item.unitPrice,
     total: item.total,
    })),
    contact: invoice.contact ? {
     name: [invoice.contact.firstName, invoice.contact.lastName].filter(Boolean).join(' ') || 'Contact',
     email: invoice.contact.email,
     companyName: invoice.company?.name || null,
    } : null,
    organization: {
     name: invoice.organization?.name || 'Entreprise',
     address: invoice.organization?.address,
     city: invoice.organization?.city,
     postalCode: invoice.organization?.postalCode,
     country: invoice.organization?.country,
     siret: invoice.organization?.siret,
     vatNumber: invoice.organization?.vatNumber,
     logoUrl: invoice.organization?.logoUrl,
    },
   },
   hasStripe,
  }
 } catch (error) {
  console.error('Error fetching public invoice:', error)
  return { error: 'Erreur lors de la récupération de la facture' }
 }
}

// Create Stripe Checkout Session
export async function createCheckoutSession(invoiceId: string) {
 try {
  const invoice = await db.query.invoices.findFirst({
   where: and(
    eq(schema.invoices.id, invoiceId),
    isNull(schema.invoices.deletedAt)
   ),
   with: {
    contact: true,
    organization: true,
   }
  })

  if (!invoice) {
   return { error: 'Facture introuvable' }
  }

  if (invoice.status === 'paid') {
   return { error: 'Cette facture a déjà été réglée' }
  }

  if (!invoice.organization?.stripeSecretKey) {
   return { error: 'Paiement en ligne non configuré' }
  }

  const stripe = new Stripe(invoice.organization.stripeSecretKey, {
   apiVersion: '2025-03-31.basil' as any,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
   payment_method_types: ['card'],
   line_items: [
    {
     price_data: {
      currency: 'eur',
      product_data: {
       name: `Facture ${invoice.number}`,
       description: `Paiement de la facture ${invoice.number}`,
      },
      unit_amount: invoice.total ?? 0, // Already in cents
     },
     quantity: 1,
    },
   ],
   mode: 'payment',
   success_url: `${baseUrl}/pay/${invoiceId}/success?session_id={CHECKOUT_SESSION_ID}`,
   cancel_url: `${baseUrl}/pay/${invoiceId}`,
   customer_email: invoice.contact?.email || undefined,
   metadata: {
    invoiceId: invoice.id,
    organizationId: invoice.organizationId,
   },
  })

  return { url: session.url }
 } catch (error) {
  console.error('Error creating checkout session:', error)
  return { error: 'Erreur lors de la création du paiement' }
 }
}

// Mark invoice as paid (called by webhook or manually)
export async function markInvoiceAsPaid(invoiceId: string, stripeSessionId?: string) {
 try {
  await db.update(schema.invoices)
   .set({
    status: 'paid',
    paidAt: new Date(),
    updatedAt: new Date(),
   })
   .where(eq(schema.invoices.id, invoiceId))

  // Create payment record
  const invoice = await db.query.invoices.findFirst({
   where: eq(schema.invoices.id, invoiceId),
  })

  if (invoice) {
   await db.insert(schema.payments).values({
    organizationId: invoice.organizationId,
    invoiceId: invoice.id,
    amount: invoice.total ?? 0,
    paidAt: new Date(),
    method: 'stripe',
    reference: stripeSessionId || 'manual',
   })
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  return { success: true }
 } catch (error) {
  console.error('Error marking invoice as paid:', error)
  return { error: 'Erreur' }
 }
}
