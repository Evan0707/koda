'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { changePlan } from '@/lib/actions/subscriptions'
import { PLAN_PRICING, TRIAL_DAYS, type BillingPeriod } from '@/lib/utils/plan-limits'
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface UpgradeClientProps {
 currentPlan: 'free' | 'starter' | 'pro'
 hasSubscription: boolean
 isTrialing?: boolean
}

const PLAN_ORDER = { free: 0, starter: 1, pro: 2 } as const

export default function UpgradeClient({ currentPlan, hasSubscription, isTrialing }: UpgradeClientProps) {
 const [isPending, startTransition] = useTransition()
 const [billing, setBilling] = useState<BillingPeriod>('monthly')
 const router = useRouter()
 const isAnnual = billing === 'annual'

 const handleNewSubscription = (plan: 'starter' | 'pro') => {
  startTransition(() => {
   router.push(`/dashboard/checkout?plan=${plan}&billing=${billing}`)
  })
 }

 const handleChangePlan = (newPlan: 'starter' | 'pro') => {
  startTransition(async () => {
   const result = await changePlan(newPlan)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(result.message || 'Plan modifié avec succès !')
    router.refresh()
   }
  })
 }

 const getButtonConfig = (targetPlan: 'starter' | 'pro') => {
  if (currentPlan === targetPlan) {
   return { label: 'Plan Actuel', disabled: true, action: () => {}, isChange: false, isDowngrade: false }
  }

  const isUpgrade = PLAN_ORDER[targetPlan] > PLAN_ORDER[currentPlan]
  const isDowngrade = PLAN_ORDER[targetPlan] < PLAN_ORDER[currentPlan]

  // No existing subscription — create new one
  if (!hasSubscription || currentPlan === 'free') {
   return {
    label: `Choisir ${targetPlan === 'starter' ? 'Starter' : 'Pro'}`,
    disabled: false,
    action: () => handleNewSubscription(targetPlan),
    isChange: false,
    isDowngrade: false,
   }
  }

  // Has subscription — upgrade/downgrade via plan change
  return {
   label: isUpgrade ? `Passer à ${targetPlan === 'pro' ? 'Pro' : 'Starter'}` : `Passer à ${targetPlan === 'starter' ? 'Starter' : 'Pro'}`,
   disabled: false,
   action: () => handleChangePlan(targetPlan),
   isChange: true,
   isDowngrade,
   icon: isUpgrade ? ArrowUp : ArrowDown,
  }
 }

 return (
  <div className="container max-w-7xl mx-auto py-12 px-4">
   <div className="text-center mb-16">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
     {currentPlan === 'free' ? 'Passez à un plan supérieur' : 'Gérez votre abonnement'}
    </h1>
    <p className="text-muted-foreground max-w-2xl mx-auto">
     {currentPlan === 'free'
      ? 'Débloquez plus de fonctionnalités et supprimez les commissions'
      : 'Changez de plan à tout moment. Les changements sont appliqués immédiatement avec prorata.'}
    </p>
    {isTrialing && (
     <Badge variant="secondary" className="mt-3 text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
      Période d&apos;essai en cours
     </Badge>
    )}
   </div>

   {/* Billing toggle (only for new subscriptions) */}
   {(!hasSubscription || currentPlan === 'free') && (
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
   )}

   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
    {/* FREE */}
    <Card className={`relative flex flex-col ${currentPlan === 'free' ? 'border-primary ring-1 ring-primary' : ''}`}>
     {currentPlan === 'free' && (
      <div className="absolute -top-3 left-0 right-0 flex justify-center">
       <Badge variant="default">Actuel</Badge>
      </div>
     )}
     <CardHeader>
      <CardTitle className="text-2xl">Gratuit</CardTitle>
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
      {currentPlan === 'free' ? (
       <Button disabled className="w-full" variant="outline">
        Plan Actuel
       </Button>
      ) : (
       <Button onClick={() => router.push('/dashboard/settings?tab=billing')} variant="outline" className="w-full">
        Gérer mon abonnement
       </Button>
      )}
     </CardFooter>
    </Card>

    {/* STARTER */}
    <Card className={`relative flex flex-col ${currentPlan === 'starter' ? 'border-primary ring-1 ring-primary' : 'shadow-lg scale-105'}`}>
     {currentPlan === 'starter' && (
      <div className="absolute -top-3 left-0 right-0 flex justify-center">
       <Badge variant="default">Actuel</Badge>
      </div>
     )}
     {currentPlan === 'free' && (
      <div className="absolute -top-4 left-0 right-0 flex justify-center">
       <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
        Populaire
       </span>
      </div>
     )}
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
     <CardFooter>
      {(() => {
       const config = getButtonConfig('starter')
       if (currentPlan === 'starter') {
        return <Button disabled className="w-full">Plan Actuel</Button>
       }
       if (config.isChange && config.isDowngrade) {
        return (
         <AlertDialog>
          <AlertDialogTrigger asChild>
           <Button variant="outline" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowDown className="w-4 h-4 mr-2" />}
            Passer à Starter
           </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
           <AlertDialogHeader>
            <AlertDialogTitle>Rétrograder vers Starter ?</AlertDialogTitle>
            <AlertDialogDescription>
             Votre plan passera de Pro (49€/mois) à Starter (19€/mois).
             Le changement sera appliqué immédiatement et un crédit au prorata sera calculé.
             Vous perdrez l&apos;accès aux fonctionnalités Pro (multi-utilisateurs, API, etc.).
            </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={config.action}>
             Confirmer le changement
            </AlertDialogAction>
           </AlertDialogFooter>
          </AlertDialogContent>
         </AlertDialog>
        )
       }
       return (
        <div className="w-full space-y-2">
         <Button onClick={config.action} disabled={isPending || config.disabled} className="w-full bg-primary hover:bg-primary/90">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {!hasSubscription || currentPlan === 'free' ? `Essai gratuit ${TRIAL_DAYS} jours` : config.label}
         </Button>
         {(!hasSubscription || currentPlan === 'free') && (
          <p className="text-xs text-muted-foreground text-center">
           Puis {isAnnual ? `${PLAN_PRICING.starter.annual}€/mois` : `${PLAN_PRICING.starter.monthly}€/mois`} — sans engagement
          </p>
         )}
        </div>
       )
      })()}
     </CardFooter>
    </Card>

    {/* PRO */}
    <Card className={`relative flex flex-col ${currentPlan === 'pro' ? 'border-primary ring-1 ring-primary' : ''}`}>
     {currentPlan === 'pro' && (
      <div className="absolute -top-3 left-0 right-0 flex justify-center">
       <Badge variant="default">Actuel</Badge>
      </div>
     )}
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
     <CardFooter>
      {(() => {
       const config = getButtonConfig('pro')
       if (currentPlan === 'pro') {
        return <Button disabled className="w-full" variant="outline">Plan Actuel</Button>
       }
       return (
        <div className="w-full space-y-2">
         <Button
          onClick={config.action}
          disabled={isPending || config.disabled}
          variant={currentPlan === 'starter' ? 'default' : 'outline'}
          className="w-full"
         >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : config.isChange ? <ArrowUp className="w-4 h-4 mr-2" /> : null}
          {!hasSubscription || currentPlan === 'free' ? `Essai gratuit ${TRIAL_DAYS} jours` : config.label}
         </Button>
         {(!hasSubscription || currentPlan === 'free') && (
          <p className="text-xs text-muted-foreground text-center">
           Puis {isAnnual ? `${PLAN_PRICING.pro.annual}€/mois` : `${PLAN_PRICING.pro.monthly}€/mois`} — sans engagement
          </p>
         )}
        </div>
       )
      })()}
     </CardFooter>
    </Card>
   </div>

   {/* FAQ Section */}
   <div className="mt-20 max-w-3xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Questions fréquentes</h2>
    <div className="space-y-6">
     <FAQItem
      question="Comment fonctionne la commission sur le plan gratuit ?"
      answer="Sur le plan Gratuit, nous prenons une commission de 5% sur chaque paiement Stripe. Par exemple, si votre client paie 100€, vous recevez 95€ et nous gardons 5€. Les plans payants n'ont aucune commission."
     />
     <FAQItem
      question={`Comment fonctionne l'essai gratuit de ${TRIAL_DAYS} jours ?`}
      answer={`Lors de votre première souscription à un plan payant, vous bénéficiez de ${TRIAL_DAYS} jours d'essai gratuit. Aucun paiement pendant cette période. Si vous annulez avant la fin, vous ne serez pas facturé.`}
     />
     <FAQItem
      question="Puis-je changer de plan à tout moment ?"
      answer="Oui ! Vous pouvez passer d'un plan à l'autre à tout moment. Lors d'un upgrade, un prorata est calculé automatiquement. Lors d'un downgrade, un crédit est appliqué sur votre prochaine facture."
     />
     <FAQItem
      question="Que se passe-t-il si j'atteins ma limite de factures ?"
      answer="Vous ne pourrez plus créer de factures jusqu'au mois suivant, sauf si vous passez à un plan supérieur. Nous vous notifierons avant d'atteindre la limite."
     />
     <FAQItem
      question="Comment fonctionne le prorata lors d'un changement de plan ?"
      answer="Stripe calcule automatiquement la différence. Si vous passez de Starter (19€) à Pro (49€) en milieu de mois, vous ne payez que la différence au prorata pour les jours restants."
     />
    </div>
   </div>
   <p className="text-xs text-center text-muted-foreground mt-20 mb-10">
    Paiement sécurisé par Stripe. Annulation possible à tout moment.
   </p>
  </div>
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

function FAQItem({ question, answer }: { question: string; answer: string }) {
 return (
  <div className="border-b pb-6">
   <h3 className="font-semibold text-lg mb-2">{question}</h3>
   <p className="text-muted-foreground">{answer}</p>
  </div>
 )
}
