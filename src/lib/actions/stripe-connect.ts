'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { db, schema } from '@/db'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion,
  })
}

import { requirePermission } from '@/lib/auth'

export async function createConnectAccount() {
  const auth = await requirePermission('manage_stripe')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  if (!user.organizationId) return { error: 'Organisation requise' }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, user.organizationId)
  })

  if (!org) return { error: 'Organisation introuvable' }

  try {
    let accountId = org.stripeAccountId

    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: 'express',
        email: user.email,
        country: 'FR', // Defaulting to FR, could be dynamic
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          organizationId: org.id,
        },
      })
      accountId = account.id

      await db.update(schema.organizations)
        .set({ stripeAccountId: accountId })
        .where(eq(schema.organizations.id, org.id))
    }

    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL

    const accountLink = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/settings?tab=payments`,
      return_url: `${origin}/dashboard/settings?tab=payments&success=true`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (error: unknown) {
    console.error('Stripe Connect Error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { error: message || 'Erreur lors de la création du compte Stripe' }
  }
}

export async function getStripeConnectStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const userRecord = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) })
  if (!userRecord?.organizationId) return { isConnected: false }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, userRecord.organizationId)
  })

  if (!org?.stripeAccountId) return { isConnected: false }

  try {
    const account = await getStripe().accounts.retrieve(org.stripeAccountId)
    return {
      isConnected: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      email: account.email
    }
  } catch (error) {
    return { isConnected: false }
  }
}

/**
 * Get Stripe Express dashboard login link for already-connected accounts.
 */
export async function getConnectDashboardLink() {
  const auth = await requirePermission('manage_stripe')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  if (!user.organizationId) return { error: 'Organisation requise' }

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, user.organizationId)
  })

  if (!org?.stripeAccountId) return { error: 'Compte Stripe Connect non configuré' }

  try {
    const loginLink = await getStripe().accounts.createLoginLink(org.stripeAccountId)
    return { url: loginLink.url }
  } catch (error: unknown) {
    console.error('Stripe Login Link Error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return { error: message || 'Impossible de créer le lien de connexion' }
  }
}
