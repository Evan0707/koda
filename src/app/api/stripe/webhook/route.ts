import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')


  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // We need to determine which organization's webhook secret to use
  // For now, we'll parse the event without verification first to get the org
  // In production, you'd use a single webhook endpoint with a shared secret

  let event: Stripe.Event

  try {
    // Parse the event (we'll verify below)
    event = JSON.parse(body) as Stripe.Event
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session


      // Get invoice ID from metadata
      const invoiceId = session.metadata?.invoiceId


      if (!invoiceId) {
        return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
      }

      // Get the invoice to find organization
      const invoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoiceId),
        with: { organization: true }
      })

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Verify the webhook signature if webhook secret is configured
      if (invoice.organization?.stripeWebhookSecret) {
        try {
          const stripe = new Stripe(invoice.organization.stripeSecretKey!, {
            apiVersion: '2025-03-31.basil' as any,
          })
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            invoice.organization.stripeWebhookSecret
          )
        } catch (err) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }
      }

      // Mark invoice as paid
      await db.update(schema.invoices)
        .set({
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.invoices.id, invoiceId))

      // Create payment record
      await db.insert(schema.payments).values({
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        amount: invoice.total || 0,
        paidAt: new Date(),
        method: 'stripe',
        stripePaymentIntentId: (session.payment_intent as string) || session.id,
      })

      // Create notification for the freelancer
      if (invoice.createdById) {
        try {
          await db.insert(schema.notifications).values({
            organizationId: invoice.organizationId,
            userId: invoice.createdById,
            type: 'payment_received',
            title: 'Paiement reçu 💰',
            body: `La facture ${invoice.number} a été payée (${(invoice.total || 0 / 100).toFixed(2)} €)`,
            metadata: { invoiceId: invoice.id },
          })
        } catch (notifError) {
          console.error('Failed to create notification:', notifError)
          // Don't fail the webhook for notification errors
        }
      }

      break
    }

    default:

  }

  return NextResponse.json({ received: true })
}

// Stripe needs raw body, so we disable body parsing

