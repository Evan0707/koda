'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface UpgradeClientProps {
 currentPlan: 'free' | 'starter' | 'pro'
}

export default function UpgradeClient({ currentPlan }: UpgradeClientProps) {
 const [isPending, startTransition] = useTransition()
 const router = useRouter()

 const handleUpgrade = (plan: 'starter' | 'pro') => {
  startTransition(() => {
   router.push(`/dashboard/checkout?plan=${plan}`)
  })
 }

 const handleManage = () => {
  router.push('/dashboard/settings?tab=billing')
 }

 return (
  <div className="container max-w-7xl mx-auto py-12 px-4">
   <div className="text-center mb-16">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">
     Gérez votre abonnement
    </h1>
    <p className="text-muted-foreground max-w-2xl mx-auto">
     Passez à un plan supérieur pour débloquer plus de fonctionnalités et supprimer les commissions
    </p>
   </div>

   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
    {/* FREE */}
    <Card className={`relative flex flex-col ${currentPlan === 'free' ? 'border-primary ring-1 ring-primary' : ''}`}>
     {currentPlan === 'free' && (
      <div className="absolute -top-3 left-0 right-0 flex justify-center">
       <Badge variant="default">Actuel</Badge>
      </div>
     )}
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
       <Feature included>Envoi d'emails</Feature>
       <Feature>Commission 5% par transaction</Feature>
      </ul>
     </CardContent>
     <CardFooter>
      {currentPlan === 'free' ? (
       <Button disabled className="w-full" variant="outline">
        Plan Actuel
       </Button>
      ) : (
       <Button onClick={handleManage} variant="outline" className="w-full">
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
     {currentPlan !== 'starter' && currentPlan !== 'pro' && (
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
       <span className="text-4xl font-bold">19€</span>
       <span className="text-muted-foreground">/mois</span>
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
      {currentPlan === 'starter' ? (
       <Button disabled className="w-full">
        Plan Actuel
       </Button>
      ) : (
       <Button
        onClick={() => handleUpgrade('starter')}
        disabled={isPending || currentPlan === 'pro'} // Cannot downgrade directly effectively
        className="w-full bg-primary hover:bg-primary/90"
       >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choisir Starter'}
       </Button>
      )}
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
       <span className="text-4xl font-bold">49€</span>
       <span className="text-muted-foreground">/mois</span>
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
      {currentPlan === 'pro' ? (
       <Button disabled className="w-full" variant="outline">
        Plan Actuel
       </Button>
      ) : (
       <Button
        onClick={() => handleUpgrade('pro')}
        disabled={isPending}
        variant="outline"
        className="w-full"
       >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Choisir Pro'}
       </Button>
      )}
     </CardFooter>
    </Card>
   </div>

   {/* FAQ Section */}
   <div className="mt-20 max-w-3xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Questions fréquentes</h2>
    <div className="space-y-6">
     <FAQItem
      question="Comment fonctionne la commission sur le plan gratuit ?"
      answer="Sur le plan FREE, nous prenons une commission de 5% sur chaque paiement Stripe. Par exemple, si votre client paie 100€, vous recevez 95€ et nous gardons 5€. Les plans payants n'ont aucune commission."
     />
     <FAQItem
      question="Puis-je changer de plan à tout moment ?"
      answer="Oui ! Vous pouvez upgrader ou downgrader à tout moment. Lors d'un upgrade, vous serez facturé au prorata. Lors d'un downgrade, le changement prendra effet à la fin de votre période de facturation."
     />
     <FAQItem
      question="Que se passe-t-il si j'atteins ma limite de factures ?"
      answer="Vous ne pourrez plus créer de factures jusqu'au mois suivant, sauf si vous passez à un plan supérieur. Nous vous notifierons avant d'atteindre la limite."
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
