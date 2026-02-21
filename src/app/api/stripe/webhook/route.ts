import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

// ─── Stripe Webhook: Your Account ────────────────────────
// Handles events from YOUR Stripe account (SaaS subscriptions, billing).
// Endpoint: /api/stripe/webhook
// Stripe Dashboard: "Listen to events on your account"

export const runtime = 'nodejs'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
  })
}

function verifyWebhook(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  return getStripe().webhooks.constructEvent(body, signature, secret)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyWebhook(body, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ─── Subscription created via Checkout ──────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const orgId = session.metadata?.organizationId
        const plan = session.metadata?.plan as 'starter' | 'pro' | undefined

        if (!orgId || !plan) {
          console.error('[Webhook] checkout.session.completed: missing metadata')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id

        if (!subscriptionId) {
          console.error('[Webhook] checkout.session.completed: missing subscription ID')
          return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        await db.update(schema.organizations)
          .set({
            plan,
            planStatus: 'active',
            stripeSubscriptionId: subscriptionId,
            commissionRate: '0',
          })
          .where(eq(schema.organizations.id, orgId))

        // Upsert subscription record
        const existingSub = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.organizationId, orgId),
        })
        if (existingSub) {
          await db.update(schema.subscriptions)
            .set({ plan, status: 'active', stripeSubscriptionId: subscriptionId })
            .where(eq(schema.subscriptions.id, existingSub.id))
        } else {
          await db.insert(schema.subscriptions).values({
            organizationId: orgId,
            plan,
            status: 'active',
            stripeSubscriptionId: subscriptionId,
          })
        }
        break
      }

      // ─── Subscription updated (plan change, trial end) ─
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const org = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeSubscriptionId, subscription.id),
        })
        if (!org) {
          console.warn(`[Webhook] subscription.updated: org not found for ${subscription.id}`)
          break
        }

        // Detect plan from price
        const currentPriceId = subscription.items?.data?.[0]?.price?.id
        let detectedPlan = org.plan
        if (currentPriceId) {
          if (currentPriceId === process.env.STRIPE_PRICE_STARTER_MONTHLY ||
              currentPriceId === process.env.STRIPE_PRICE_STARTER_ANNUAL) {
            detectedPlan = 'starter'
          } else if (currentPriceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
                     currentPriceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
            detectedPlan = 'pro'
          }
        }

        // Get period from subscription items (Stripe API v2)
        const firstItem = subscription.items?.data?.[0]
        const periodEnd = firstItem?.current_period_end
        const periodStart = firstItem?.current_period_start

        await db.update(schema.organizations)
          .set({
            plan: detectedPlan,
            planStatus: subscription.status,
            ...(periodEnd ? { subscriptionCurrentPeriodEnd: new Date(periodEnd * 1000) } : {}),
            commissionRate: detectedPlan !== 'free' ? '0' : '0.05',
          })
          .where(eq(schema.organizations.id, org.id))

        await db.update(schema.subscriptions)
          .set({
            plan: detectedPlan,
            status: subscription.status,
            ...(periodEnd ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
            ...(periodStart ? { currentPeriodStart: new Date(periodStart * 1000) } : {}),
          })
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
        break
      }

      // ─── Subscription canceled ─────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const org = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeSubscriptionId, subscription.id),
        })
        if (!org) {
          console.warn(`[Webhook] subscription.deleted: org not found for ${subscription.id}`)
          break
        }

        await db.update(schema.organizations)
          .set({
            plan: 'free',
            planStatus: 'canceled',
            stripeSubscriptionId: null,
            commissionRate: '0.05',
          })
          .where(eq(schema.organizations.id, org.id))

        await db.update(schema.subscriptions)
          .set({ status: 'canceled', canceledAt: new Date() })
          .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))

        // Notify all org users
        const orgUsers = await db.query.users.findMany({
          where: eq(schema.users.organizationId, org.id),
        })
        for (const orgUser of orgUsers) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: org.id,
              userId: orgUser.id,
              type: 'subscription_canceled',
              title: 'Abonnement annulé',
              body: 'Votre abonnement a pris fin. Vous êtes maintenant sur le plan Gratuit avec une commission de 5%.',
              metadata: {},
              resourceType: 'organization',
              resourceId: org.id,
            })
          } catch (e) {
            console.error('[Webhook] Failed to create cancellation notification:', e)
          }
        }
        break
      }

      // ─── Subscription payment failed ───────────────────
      case 'invoice.payment_failed': {
        const stripeInvoice = event.data.object as Stripe.Invoice
        // In Stripe API v2, subscription is in parent.subscription_details
        const subDetails = stripeInvoice.parent?.subscription_details
        const subscriptionId = typeof subDetails?.subscription === 'string'
          ? subDetails.subscription
          : subDetails?.subscription?.id

        if (!subscriptionId) break

        const org = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeSubscriptionId, subscriptionId),
        })
        if (!org) break

        await db.update(schema.organizations)
          .set({ planStatus: 'past_due' })
          .where(eq(schema.organizations.id, org.id))

        const orgUsers = await db.query.users.findMany({
          where: eq(schema.users.organizationId, org.id),
        })
        for (const orgUser of orgUsers) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: org.id,
              userId: orgUser.id,
              type: 'payment_failed',
              title: 'Échec de paiement ⚠️',
              body: 'Le paiement de votre abonnement a échoué. Veuillez mettre à jour votre moyen de paiement.',
              metadata: {},
              resourceType: 'organization',
              resourceId: org.id,
            })
          } catch (e) {
            console.error('[Webhook] Failed to create payment_failed notification:', e)
          }
        }
        break
      }

      default:
        // Unhandled event — acknowledge silently
    }
  } catch (error) {
    console.error(`[Webhook] Error handling ${event.type}:`, error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}