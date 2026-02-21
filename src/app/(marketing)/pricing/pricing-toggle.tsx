'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PLAN_PRICING, TRIAL_DAYS, type BillingPeriod } from '@/lib/utils/plan-limits'

export function PricingToggle() {
 const [billing, setBilling] = useState<BillingPeriod>('monthly')
 const isAnnual = billing === 'annual'

 return (
  <>
   {/* Billing toggle */}
   <div className="flex items-center justify-center gap-3 mb-12">
    <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
     Mensuel
    </span>
    <button
     type="button"
     role="switch"
     aria-checked={isAnnual}
     onClick={() => setBilling(isAnnual ? 'monthly' : 'annual')}
     className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
      isAnnual ? 'bg-primary' : 'bg-muted'
     }`}
    >
     <span
      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
       isAnnual ? 'translate-x-5' : 'translate-x-0'
      }`}
     />
    </button>
    <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
     Annuel
    </span>
    {isAnnual && (
     <Badge variant="secondary" className="text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
      -20%
     </Badge>
    )}
   </div>

   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
    {/* FREE */}
    <Card className="relative flex flex-col">
     <CardHeader>
      <CardTitle className="text-2xl">Free</CardTitle>
      <CardDescription>Pour démarrer</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">0€</span>
       <span className="text-muted-foreground">/mois</span>
      </div>
     </CardHeader>
     <CardContent className="flex-1">
      <ul className="space-y-3">
       <Feature included>10 factures/mois</Feature>
       <Feature included>10 devis/mois</Feature>
       <Feature included>50 contacts</Feature>
       <Feature included>Paiement Stripe uniquement</Feature>
       <Feature included>Envoi d&apos;emails</Feature>
       <Feature>Commission 5% par transaction</Feature>
      </ul>
     </CardContent>
     <CardFooter>
      <Button asChild className="w-full" variant="outline">
       <Link href="/signup">Commencer gratuitement</Link>
      </Button>
     </CardFooter>
    </Card>

    {/* STARTER */}
    <Card className="relative flex flex-col border-primary shadow-lg scale-105">
     <div className="absolute -top-4 left-0 right-0 flex justify-center">
      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
       Populaire
      </span>
     </div>
     <CardHeader>
      <CardTitle className="text-2xl">Starter</CardTitle>
      <CardDescription>Pour freelances actifs</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">
        {isAnnual ? `${PLAN_PRICING.starter.annual}€` : `${PLAN_PRICING.starter.monthly}€`}
       </span>
       <span className="text-muted-foreground">/mois</span>
       {isAnnual && (
        <p className="text-sm text-muted-foreground mt-1">
         {PLAN_PRICING.starter.annualTotal}€ facturés par an
        </p>
       )}
      </div>
     </CardHeader>
     <CardContent className="flex-1">
      <ul className="space-y-3">
       <Feature included>100 factures/mois</Feature>
       <Feature included>100 devis/mois</Feature>
       <Feature included>500 contacts</Feature>
       <Feature included>Tous moyens de paiement</Feature>
       <Feature included>IA Email</Feature>
       <Feature included>Modèles personnalisés</Feature>
       <Feature included bold>Commission 0%</Feature>
      </ul>
     </CardContent>
     <CardFooter className="flex-col gap-2">
      <Button asChild className="w-full bg-primary hover:bg-primary/90">
       <Link href={`/signup?plan=starter&billing=${billing}`}>
        Essai gratuit {TRIAL_DAYS} jours
       </Link>
      </Button>
      <p className="text-xs text-muted-foreground text-center">
       Puis {isAnnual ? `${PLAN_PRICING.starter.annual}€/mois` : `${PLAN_PRICING.starter.monthly}€/mois`} — sans engagement
      </p>
     </CardFooter>
    </Card>

    {/* PRO */}
    <Card className="relative flex flex-col">
     <CardHeader>
      <CardTitle className="text-2xl">Pro</CardTitle>
      <CardDescription>Pour équipes</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">
        {isAnnual ? `${PLAN_PRICING.pro.annual}€` : `${PLAN_PRICING.pro.monthly}€`}
       </span>
       <span className="text-muted-foreground">/mois</span>
       {isAnnual && (
        <p className="text-sm text-muted-foreground mt-1">
         {PLAN_PRICING.pro.annualTotal}€ facturés par an
        </p>
       )}
      </div>
     </CardHeader>
     <CardContent className="flex-1">
      <ul className="space-y-3">
       <Feature included>Factures illimitées</Feature>
       <Feature included>Devis illimités</Feature>
       <Feature included>Contacts illimités</Feature>
       <Feature included>Tous moyens de paiement</Feature>
       <Feature included>Multi-utilisateurs</Feature>
       <Feature included>API & Webhooks</Feature>
       <Feature included>Support prioritaire</Feature>
       <Feature included bold>Commission 0%</Feature>
      </ul>
     </CardContent>
     <CardFooter className="flex-col gap-2">
      <Button asChild variant="outline" className="w-full">
       <Link href={`/signup?plan=pro&billing=${billing}`}>
        Essai gratuit {TRIAL_DAYS} jours
       </Link>
      </Button>
      <p className="text-xs text-muted-foreground text-center">
       Puis {isAnnual ? `${PLAN_PRICING.pro.annual}€/mois` : `${PLAN_PRICING.pro.monthly}€/mois`} — sans engagement
      </p>
     </CardFooter>
    </Card>
   </div>
  </>
 )
}

function Feature({ included = false, bold = false, children }: { included?: boolean; bold?: boolean; children: React.ReactNode }) {
 return (
  <li className="flex items-start gap-2">
   {included ? (
    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
   ) : (
    <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
   )}
   <span className={bold ? 'font-semibold' : ''}>{children}</span>
  </li>
 )
}
