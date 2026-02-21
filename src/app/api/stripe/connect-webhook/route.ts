import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'

// ─── Stripe Webhook: Connected Accounts ──────────────────
// Handles events from CONNECTED Stripe accounts (freelancer invoice payments,
// refunds, Connect account status changes).
// Endpoint: /api/stripe/connect-webhook
// Stripe Dashboard: "Listen to events on Connected accounts"

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
})

function verifyConnectWebhook(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_CONNECT_WEBHOOK_SECRET not configured')
  return stripe.webhooks.constructEvent(body, signature, secret)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyConnectWebhook(body, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Connect Webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Connected account ID (present on all Connect events)
  const connectedAccountId = event.account

  try {
    switch (event.type) {
      // ─── Invoice paid via Checkout (on connected account) ─
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Skip subscription checkouts (handled by main webhook)
        if (session.mode === 'subscription') break

        const invoiceId = session.metadata?.invoiceId
        if (!invoiceId) {
          console.warn('[Connect Webhook] checkout.session.completed: missing invoiceId metadata')
          break
        }

        // Idempotency: skip if already processed
        const existingPayment = await db.query.payments.findFirst({
          where: eq(schema.payments.reference, session.id),
        })
        if (existingPayment) {
          console.log(`[Connect Webhook] Session ${session.id} already processed, skipping`)
          break
        }

        const invoice = await db.query.invoices.findFirst({
          where: eq(schema.invoices.id, invoiceId),
        })
        if (!invoice) {
          console.error(`[Connect Webhook] Invoice not found: ${invoiceId}`)
          break
        }

        // Skip if already paid (extra idempotency guard)
        if (invoice.status === 'paid') break

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
          reference: session.id,
          stripePaymentIntentId: paymentIntentId,
        })

        // Notify the freelancer
        if (invoice.createdById) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: invoice.organizationId,
              userId: invoice.createdById,
              type: 'payment_received',
              title: 'Paiement reçu 💰',
              body: `La facture ${invoice.number} a été payée (${((invoice.total || 0) / 100).toFixed(2)} €)`,
              metadata: { invoiceId: invoice.id },
              resourceType: 'invoice',
              resourceId: invoice.id,
            })
          } catch (e) {
            console.error('[Connect Webhook] Failed to create payment notification:', e)
          }
        }
        break
      }

      // ─── Refund on connected account ─────────────────────
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id

        if (!paymentIntentId) break

        const payment = await db.query.payments.findFirst({
          where: eq(schema.payments.stripePaymentIntentId, paymentIntentId),
        })
        if (!payment) {
          console.log(`[Connect Webhook] No payment found for refunded charge PI: ${paymentIntentId}`)
          break
        }

        if (payment.invoiceId) {
          await db.update(schema.invoices)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(eq(schema.invoices.id, payment.invoiceId))

          const refundedInvoice = await db.query.invoices.findFirst({
            where: eq(schema.invoices.id, payment.invoiceId),
          })
          if (refundedInvoice?.createdById) {
            try {
              await db.insert(schema.notifications).values({
                organizationId: payment.organizationId,
                userId: refundedInvoice.createdById,
                type: 'payment_refunded',
                title: 'Paiement remboursé',
                body: `Le paiement de la facture ${refundedInvoice.number} a été remboursé (${((charge.amount_refunded || 0) / 100).toFixed(2)} €)`,
                metadata: { invoiceId: payment.invoiceId },
                resourceType: 'invoice',
                resourceId: payment.invoiceId,
              })
            } catch (e) {
              console.error('[Connect Webhook] Failed to create refund notification:', e)
            }
          }
        }
        break
      }

      // ─── Connect account status changed ──────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const accountId = account.id

        const connectOrg = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeAccountId, accountId),
        })
        if (!connectOrg) {
          console.log(`[Connect Webhook] No org found for account: ${accountId}`)
          break
        }

        // Notify if charges disabled (requires user action)
        if (!account.charges_enabled) {
          const orgUsers = await db.query.users.findMany({
            where: eq(schema.users.organizationId, connectOrg.id),
          })
          for (const orgUser of orgUsers) {
            try {
              await db.insert(schema.notifications).values({
                organizationId: connectOrg.id,
                userId: orgUser.id,
                type: 'stripe_connect_issue',
                title: 'Compte Stripe Connect ⚠️',
                body: 'Votre compte Stripe Connect nécessite une vérification. Veuillez vérifier votre compte dans les paramètres.',
                metadata: { accountId },
                resourceType: 'organization',
                resourceId: connectOrg.id,
              })
            } catch (e) {
              console.error('[Connect Webhook] Failed to create Connect notification:', e)
            }
          }
        }
        break
      }

      // ─── Payment dispute on connected account ────────────
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id
        const disputeAmount = dispute.amount

        // Try to find the org from the connected account
        if (!connectedAccountId) break
        const disputeOrg = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeAccountId, connectedAccountId),
        })
        if (!disputeOrg) break

        const orgUsers = await db.query.users.findMany({
          where: eq(schema.users.organizationId, disputeOrg.id),
        })
        for (const orgUser of orgUsers) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: disputeOrg.id,
              userId: orgUser.id,
              type: 'payment_dispute',
              title: 'Litige de paiement ⚠️',
              body: `Un litige de ${(disputeAmount / 100).toFixed(2)} € a été ouvert. Répondez rapidement dans votre Dashboard Stripe.`,
              metadata: { chargeId: chargeId || '', disputeId: dispute.id },
              resourceType: 'organization',
              resourceId: disputeOrg.id,
            })
          } catch (e) {
            console.error('[Connect Webhook] Failed to create dispute notification:', e)
          }
        }
        break
      }

      // ─── Payout events (optional: track money arriving) ──
      case 'payout.paid': {
        // Connected account received their money
        if (!connectedAccountId) break
        const payout = event.data.object as Stripe.Payout

        const payoutOrg = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeAccountId, connectedAccountId),
        })
        if (!payoutOrg) break

        const orgUsers = await db.query.users.findMany({
          where: eq(schema.users.organizationId, payoutOrg.id),
        })
        for (const orgUser of orgUsers) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: payoutOrg.id,
              userId: orgUser.id,
              type: 'payout_received',
              title: 'Virement reçu 🎉',
              body: `Un virement de ${(payout.amount / 100).toFixed(2)} € a été envoyé sur votre compte bancaire.`,
              metadata: { payoutId: payout.id },
              resourceType: 'organization',
              resourceId: payoutOrg.id,
            })
          } catch (e) {
            console.error('[Connect Webhook] Failed to create payout notification:', e)
          }
        }
        break
      }

      case 'payout.failed': {
        if (!connectedAccountId) break
        const payout = event.data.object as Stripe.Payout

        const payoutOrg = await db.query.organizations.findFirst({
          where: eq(schema.organizations.stripeAccountId, connectedAccountId),
        })
        if (!payoutOrg) break

        const orgUsers = await db.query.users.findMany({
          where: eq(schema.users.organizationId, payoutOrg.id),
        })
        for (const orgUser of orgUsers) {
          try {
            await db.insert(schema.notifications).values({
              organizationId: payoutOrg.id,
              userId: orgUser.id,
              type: 'payout_failed',
              title: 'Virement échoué ⚠️',
              body: `Le virement de ${(payout.amount / 100).toFixed(2)} € a échoué. Vérifiez vos informations bancaires dans Stripe.`,
              metadata: { payoutId: payout.id },
              resourceType: 'organization',
              resourceId: payoutOrg.id,
            })
          } catch (e) {
            console.error('[Connect Webhook] Failed to create payout failed notification:', e)
          }
        }
        break
      }

      default:
        // Unhandled event — acknowledge silently
    }
  } catch (error) {
    console.error(`[Connect Webhook] Error handling ${event.type}:`, error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
