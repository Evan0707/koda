import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  console.log('🔔 Stripe webhook received!')

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  console.log('📝 Body length:', body.length)
  console.log('🔑 Signature present:', !!signature)

  if (!signature) {
    console.error('❌ Missing signature')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // We need to determine which organization's webhook secret to use
  // For now, we'll parse the event without verification first to get the org
  // In production, you'd use a single webhook endpoint with a shared secret

  let event: Stripe.Event

  try {
    // Parse the event (we'll verify below)
    event = JSON.parse(body) as Stripe.Event
    console.log('📦 Event type:', event.type)
  } catch (err) {
    console.error('Webhook parsing error:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('🎉 Checkout session completed!')
      console.log('📋 Session metadata:', session.metadata)

      // Get invoice ID from metadata
      const invoiceId = session.metadata?.invoiceId

      console.log('🧾 Invoice ID:', invoiceId)

      if (!invoiceId) {
        console.error('No invoiceId in webhook metadata')
        return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
      }

      // Get the invoice to find organization
      const invoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoiceId),
        with: { organization: true }
      })

      if (!invoice) {
        console.error('Invoice not found:', invoiceId)
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
          console.error('Webhook signature verification failed:', err)
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
        amount: invoice.total,
        paymentDate: new Date(),
        paymentMethod: 'stripe',
        reference: session.id,
      })

      // Create notification for the freelancer
      try {
        await db.insert(schema.notifications).values({
          organizationId: invoice.organizationId,
          type: 'payment_received',
          title: 'Paiement reçu 💰',
          message: `La facture ${invoice.number} a été payée (${(invoice.total / 100).toFixed(2)} €)`,
          data: { invoiceId: invoice.id } as any,
        })
      } catch (notifError) {
        console.error('Failed to create notification:', notifError)
        // Don't fail the webhook for notification errors
      }

      console.log(`✅ Invoice ${invoice.number} marked as paid`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Stripe needs raw body, so we disable body parsing

