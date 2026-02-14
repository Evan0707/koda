import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

// Disable body parsing for Stripe webhooks - they need raw body
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Webhook error: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    // Create a temporary Stripe instance just for verification
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-03-31.basil' as any,
    })

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Webhook signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Check if this is a subscription checkout
      if (session.mode === 'subscription') {
        const orgId = session.metadata?.organizationId
        const plan = session.metadata?.plan as 'starter' | 'pro'

        if (!orgId || !plan) {
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

        if (!subscriptionId) {
          console.error('Missing subscription ID')
          return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        // Update organization
        await db.update(schema.organizations)
          .set({
            plan,
            planStatus: 'active',
            stripeSubscriptionId: subscriptionId,
            commissionRate: '0', // Remove commission for paid plans
          })
          .where(eq(schema.organizations.id, orgId))

        // Create subscription record
        await db.insert(schema.subscriptions).values({
          organizationId: orgId,
          plan,
          status: 'active',
          stripeSubscriptionId: subscriptionId,
        })

        break;
      }

      // Otherwise, it's an invoice payment
      const invoiceId = session.metadata?.invoiceId

      if (!invoiceId) {
        return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
      }

      // Get the invoice
      const invoice = await db.query.invoices.findFirst({
        where: eq(schema.invoices.id, invoiceId),
      })

      if (!invoice) {
        console.error(`Webhook error: Invoice not found: ${invoiceId}`)
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      }

      // Mark invoice as paid
      await db.update(schema.invoices)
        .set({
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.invoices.id, invoiceId))

      const paymentIntentId = (typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id) || session.id

      // Create payment record
      await db.insert(schema.payments).values({
        organizationId: invoice.organizationId,
        invoiceId: invoice.id,
        amount: invoice.total || 0,
        paidAt: new Date(),
        method: 'stripe',
        reference: session.id, // Add session ID as reference
        stripePaymentIntentId: paymentIntentId,
      })

      // Create notification for the freelancer
      if (invoice.createdById) {
        try {
          await db.insert(schema.notifications).values({
            organizationId: invoice.organizationId,
            userId: invoice.createdById, // TS knows this is string here
            type: 'payment_received',
            title: 'Paiement reçu 💰',
            body: `La facture ${invoice.number} a été payée (${((invoice.total || 0) / 100).toFixed(2)} €)`,
            metadata: { invoiceId: invoice.id },
            resourceType: 'invoice',
            resourceId: invoice.id,
          })
        } catch (notifError) {
          console.error('Failed to create notification:', notifError)
        }
      }

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as any
      const subscriptionId = subscription.id

      // Find organization by stripe subscription ID
      const org = await db.query.organizations.findFirst({
        where: eq(schema.organizations.stripeSubscriptionId, subscriptionId),
      })

      if (!org) {
        console.error(`Organization not found for subscription: ${subscriptionId}`)
        break
      }

      await db.update(schema.organizations)
        .set({
          planStatus: subscription.status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
        .where(eq(schema.organizations.id, org.id))

      // Update subscription record
      await db.update(schema.subscriptions)
        .set({
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
        })
        .where(eq(schema.subscriptions.stripeSubscriptionId, subscriptionId))
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any
      const subscriptionId = subscription.id

      // Find organization by stripe subscription ID
      const org = await db.query.organizations.findFirst({
        where: eq(schema.organizations.stripeSubscriptionId, subscriptionId),
      })

      if (!org) {
        console.error(`Organization not found for subscription: ${subscriptionId}`)
        break
      }

      // Revert to FREE plan
      await db.update(schema.organizations)
        .set({
          plan: 'free',
          planStatus: 'canceled',
          stripeSubscriptionId: null,
          commissionRate: '0.05', // Reactivate 5% commission
        })
        .where(eq(schema.organizations.id, org.id))

      // Update subscription record
      await db.update(schema.subscriptions)
        .set({
          status: 'canceled',
          canceledAt: new Date(),
        })
        .where(eq(schema.subscriptions.stripeSubscriptionId, subscriptionId))
      break
    }

    default:
      // Unhandled event type — ignore silently
  }

  return NextResponse.json({ received: true })
}