'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAppUrl } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil' as any,
})

import { requirePermission } from '@/lib/auth'

export async function createSubscriptionCheckout(plan: 'starter' | 'pro') {
  const auth = await requirePermission('manage_subscription')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!userRecord?.organizationId) {
    return { error: 'Organisation introuvable' }
  }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId),
  })

  if (!org) return { error: 'Organisation introuvable' }

  // Check if already on the same plan
  if (org.plan === plan && org.planStatus === 'active') {
    return { error: `Vous êtes déjà abonné au plan ${plan === 'starter' ? 'Starter' : 'Pro'}` }
  }

  // 1. Create/Get Stripe Customer
  let customerId = org.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: org.name,
      metadata: {
        organizationId: org.id,
      },
    })
    customerId = customer.id

    await db.update(schema.organizations)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.organizations.id, org.id))
  } else {
    // Verify customer still exists in Stripe
    try {
      await stripe.customers.retrieve(customerId)
    } catch (error: unknown) {
      // Check for resource_missing error code safely
      // Stripe errors have a code property, but we must cast safely
      const stripeError = error as { code?: string }
      if (stripeError?.code === 'resource_missing') {
        const customer = await stripe.customers.create({
          email: user.email,
          name: org.name,
          metadata: {
            organizationId: org.id,
          },
        })
        customerId = customer.id
        await db.update(schema.organizations)
          .set({ stripeCustomerId: customerId })
          .where(eq(schema.organizations.id, org.id))
      }
    }
  }



  // Get price ID from environment
  const priceId = plan === 'starter'
    ? process.env.STRIPE_PRICE_STARTER_MONTHLY
    : process.env.STRIPE_PRICE_PRO_MONTHLY

  if (!priceId) {
    return { error: 'Configuration Stripe manquante' }
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    ui_mode: 'embedded',
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    return_url: `${getAppUrl()}/dashboard/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      organizationId: org.id,
      plan,
      userId: user.id
    },
  })

  return { clientSecret: session.client_secret }
}

export async function cancelSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!userRecord?.organizationId) {
    return { error: 'Organisation introuvable' }
  }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId),
  })

  if (!org?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif' }
  }

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true,
  })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!userRecord?.organizationId) {
    return { error: 'Organisation introuvable' }
  }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId),
  })

  if (!org) return { error: 'Organisation introuvable' }

  let cancelAtPeriodEnd = false

  // Fetch real-time status from Stripe if subscription exists
  if (org.stripeSubscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId)
      cancelAtPeriodEnd = sub.cancel_at_period_end
    } catch (error) {
      console.error('Error fetching stripe subscription:', error)
    }
  }

  return {
    plan: org.plan || 'free',
    planStatus: org.planStatus || 'active',
    subscriptionEndDate: org.subscriptionCurrentPeriodEnd,
    stripeSubscriptionId: org.stripeSubscriptionId,
    commissionRate: org.commissionRate,
    monthlyInvoiceCount: org.monthlyInvoiceCount,
    cancelAtPeriodEnd,
  }
}

export async function resumeSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!userRecord?.organizationId) {
    return { error: 'Organisation introuvable' }
  }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId),
  })

  if (!org?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif' }
  }

  try {
    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    // Update DB to reflect active status immediately (optimistic)
    await db.update(schema.organizations)
      .set({ planStatus: 'active' })
      .where(eq(schema.organizations.id, org.id))

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { error: message || 'Erreur lors de la reprise de l\'abonnement' }
  }
}

export async function createCustomerPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  // Get user's organization
  const userRecord = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!userRecord?.organizationId) {
    return { error: 'Organisation introuvable' }
  }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId),
  })

  if (!org?.stripeCustomerId) {
    return { error: 'Aucun client Stripe associé' }
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/settings?tab=billing`,
  })

  return { url: session.url }
}
