'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getAppUrl } from '@/lib/utils'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
  })
}

import { requirePermission } from '@/lib/auth'

/** Check if a Stripe error means the resource no longer exists */
function isStaleSubscription(error: unknown): boolean {
  const e = error as { code?: string; type?: string }
  return e?.code === 'resource_missing' || e?.type === 'invalid_request_error'
}

/** Clear stale subscription data from an org when Stripe no longer has it */
async function clearStaleSubscription(orgId: string) {
  console.warn(`[Stripe] Clearing stale subscription for org ${orgId}`)
  await db.update(schema.organizations)
    .set({
      stripeSubscriptionId: null,
      plan: 'free',
      planStatus: 'active',
      commissionRate: '0.05',
      subscriptionCurrentPeriodEnd: null,
    })
    .where(eq(schema.organizations.id, orgId))
}

export async function createSubscriptionCheckout(plan: 'starter' | 'pro', billing: 'monthly' | 'annual' = 'monthly') {
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
    const customer = await getStripe().customers.create({
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
      await getStripe().customers.retrieve(customerId)
    } catch (error: unknown) {
      // Check for resource_missing error code safely
      // Stripe errors have a code property, but we must cast safely
      const stripeError = error as { code?: string }
      if (stripeError?.code === 'resource_missing') {
        const customer = await getStripe().customers.create({
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



  // Get price ID from environment based on billing period
  let priceId: string | undefined
  if (billing === 'annual') {
    priceId = plan === 'starter'
      ? process.env.STRIPE_PRICE_STARTER_ANNUAL
      : process.env.STRIPE_PRICE_PRO_ANNUAL
  } else {
    priceId = plan === 'starter'
      ? process.env.STRIPE_PRICE_STARTER_MONTHLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY
  }

  if (!priceId) {
    return { error: 'Configuration Stripe manquante' }
  }

  // Determine if user is eligible for a free trial (never had a paid subscription before)
  const { TRIAL_DAYS } = await import('@/lib/utils/plan-limits')
  const previousSubscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.organizationId, org.id),
  })
  const isEligibleForTrial = !previousSubscription

  // Create checkout session
  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    ui_mode: 'embedded',
    payment_method_types: ['link'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    ...(isEligibleForTrial ? {
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        trial_settings: {
          end_behavior: { missing_payment_method: 'cancel' },
        },
      },
    } : {}),
    return_url: `${getAppUrl()}/dashboard/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      organizationId: org.id,
      plan,
      billing,
      userId: user.id
    },
  })

  return { clientSecret: session.client_secret }
}

export async function cancelSubscription() {
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

  if (!org?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif' }
  }

  try {
    // Cancel at period end (not immediately)
    await getStripe().subscriptions.update(org.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  } catch (error) {
    if (isStaleSubscription(error)) {
      await clearStaleSubscription(org.id)
      return { error: 'L\'abonnement n\'existe plus chez Stripe. Votre compte a été réinitialisé au plan Gratuit.' }
    }
    throw error
  }

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
  let isTrialing = false
  let trialEnd: Date | null = null
  let billingPeriod: 'monthly' | 'annual' = 'monthly'

  // Fetch real-time status from Stripe if subscription exists
  let stripeSubValid = true
  if (org.stripeSubscriptionId) {
    try {
      const sub = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId)
      cancelAtPeriodEnd = sub.cancel_at_period_end
      isTrialing = sub.status === 'trialing'
      trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null

      // Detect billing period from subscription interval
      const interval = sub.items.data[0]?.price?.recurring?.interval
      billingPeriod = interval === 'year' ? 'annual' : 'monthly'
    } catch (error) {
      console.error('Error fetching stripe subscription:', error)
      if (isStaleSubscription(error)) {
        await clearStaleSubscription(org.id)
        stripeSubValid = false
      }
    }
  }

  // If the subscription was stale, return cleaned-up free plan data
  if (!stripeSubValid) {
    return {
      plan: 'free' as const,
      planStatus: 'active',
      subscriptionEndDate: null,
      stripeSubscriptionId: null,
      commissionRate: '0.05',
      monthlyInvoiceCount: org.monthlyInvoiceCount,
      cancelAtPeriodEnd: false,
      isTrialing: false,
      trialEnd: null,
      billingPeriod: 'monthly' as const,
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
    isTrialing,
    trialEnd,
    billingPeriod,
  }
}

export async function resumeSubscription() {
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

  if (!org?.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif' }
  }

  try {
    await getStripe().subscriptions.update(org.stripeSubscriptionId, {
      cancel_at_period_end: false,
    })

    // Update DB to reflect active status immediately (optimistic)
    await db.update(schema.organizations)
      .set({ planStatus: 'active' })
      .where(eq(schema.organizations.id, org.id))

    revalidatePath('/dashboard/settings')
    return { success: true }
  } catch (error: unknown) {
    if (isStaleSubscription(error)) {
      await clearStaleSubscription(org.id)
      return { error: 'L\'abonnement n\'existe plus chez Stripe. Votre compte a été réinitialisé au plan Gratuit.' }
    }
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

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/settings?tab=billing`,
  })

  return { url: session.url }
}

// Change plan (upgrade or downgrade) with proration
export async function changePlan(newPlan: 'starter' | 'pro') {
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

  // Must have an active subscription to change plan
  if (!org.stripeSubscriptionId) {
    return { error: 'Aucun abonnement actif. Veuillez d\'abord souscrire à un plan.' }
  }

  // Check if already on the same plan
  if (org.plan === newPlan) {
    return { error: `Vous êtes déjà sur le plan ${newPlan === 'starter' ? 'Starter' : 'Pro'}` }
  }

  const newPriceId = newPlan === 'starter'
    ? process.env.STRIPE_PRICE_STARTER_MONTHLY
    : process.env.STRIPE_PRICE_PRO_MONTHLY

  // Also check annual prices for plan detection
  const newAnnualPriceId = newPlan === 'starter'
    ? process.env.STRIPE_PRICE_STARTER_ANNUAL
    : process.env.STRIPE_PRICE_PRO_ANNUAL

  if (!newPriceId) {
    return { error: 'Configuration Stripe manquante' }
  }

  try {
    // Retrieve current subscription to get the item ID
    const subscription = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId)

    if (!subscription || subscription.status === 'canceled') {
      return { error: 'Abonnement non trouvé ou annulé' }
    }

    const subscriptionItemId = subscription.items.data[0]?.id
    if (!subscriptionItemId) {
      return { error: 'Impossible de trouver l\'élément d\'abonnement' }
    }

    // Detect if current subscription is annual to preserve billing period
    const currentInterval = subscription.items.data[0]?.price?.recurring?.interval
    const isCurrentlyAnnual = currentInterval === 'year'
    const priceToUse = isCurrentlyAnnual && newAnnualPriceId ? newAnnualPriceId : newPriceId

    // Update subscription with proration
    const isUpgrade = (org.plan === 'starter' && newPlan === 'pro') ||
                      (org.plan === 'free' && (newPlan === 'starter' || newPlan === 'pro'))

    await getStripe().subscriptions.update(org.stripeSubscriptionId, {
      items: [{
        id: subscriptionItemId,
        price: priceToUse,
      }],
      proration_behavior: isUpgrade ? 'create_prorations' : 'none',
      // Cancel the cancel_at_period_end if changing plan
      cancel_at_period_end: false,
    })

    // Update organization plan in DB immediately
    await db.update(schema.organizations)
      .set({
        plan: newPlan,
        planStatus: 'active',
        commissionRate: '0',
      })
      .where(eq(schema.organizations.id, org.id))

    // Create subscription record for the plan change
    await db.insert(schema.subscriptions).values({
      organizationId: org.id,
      plan: newPlan,
      status: 'active',
      stripeSubscriptionId: org.stripeSubscriptionId,
    })

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/upgrade')

    const planLabel = newPlan === 'starter' ? 'Starter' : 'Pro'
    return { success: true, message: `Plan changé vers ${planLabel} avec succès` }
  } catch (error: unknown) {
    console.error('Error changing plan:', error)
    if (isStaleSubscription(error)) {
      await clearStaleSubscription(org.id)
      return { error: 'L\'abonnement n\'existe plus chez Stripe. Votre compte a été réinitialisé au plan Gratuit.' }
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { error: message || 'Erreur lors du changement de plan' }
  }
}
