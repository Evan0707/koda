'use client'

import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
 EmbeddedCheckoutProvider,
 EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import { createSubscriptionCheckout } from '@/lib/actions/subscriptions'
import { useEffect, useState } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CheckoutPage() {
 const searchParams = useSearchParams()
 const plan = searchParams?.get('plan') as 'starter' | 'pro'
 const billing = (searchParams?.get('billing') as 'monthly' | 'annual') || 'monthly'
 const [clientSecret, setClientSecret] = useState<string | null>(null)

 useEffect(() => {
  if (plan) {
   createSubscriptionCheckout(plan, billing)
    .then((data) => {
     if (data.clientSecret) {
      setClientSecret(data.clientSecret)
     } else {
      console.error('Failed to create checkout session', data)
     }
    })
  }
 }, [plan, billing])

 if (!plan) {
  return <div>Plan invalide.</div>
 }

 if (!clientSecret) {
  return (
   <div className="flex h-[50vh] items-center justify-center">
    <div className="animate-pulse">Chargement du paiement sécurisé...</div>
   </div>
  )
 }

 return (
  <div className="container max-w-4xl mx-auto py-8 px-4">
   <h1 className="text-2xl font-bold mb-6 text-center">Finaliser votre abonnement</h1>
   <div id="checkout">
    <EmbeddedCheckoutProvider
     stripe={stripePromise}
     options={{ clientSecret }}
    >
     <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
   </div>
  </div>
 )
}
