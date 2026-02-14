import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PricingPage() {
 return (
  <div className="container max-w-7xl mx-auto py-20 px-4">
   <div className="text-center mb-16">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
     Choisissez votre plan
    </h1>
    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
     Commencez gratuitement, passez à un plan payant pour débloquer plus de fonctionnalités et supprimer les commissions
    </p>
   </div>

   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
    {/* FREE */}
    <Card className="relative">
     <CardHeader>
      <CardTitle className="text-2xl">Free</CardTitle>
      <CardDescription>Pour démarrer</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">0€</span>
       <span className="text-muted-foreground">/mois</span>
      </div>
     </CardHeader>
     <CardContent>
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
      <Button asChild className="w-full">
       <Link href="/signup">Commencer gratuitement</Link>
      </Button>
     </CardFooter>
    </Card>

    {/* STARTER */}
    <Card className="relative border-primary shadow-lg scale-105">
     <div className="absolute -top-4 left-0 right-0 flex justify-center">
      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
       Populaire
      </span>
     </div>
     <CardHeader>
      <CardTitle className="text-2xl">Starter</CardTitle>
      <CardDescription>Pour freelances actifs</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">19€</span>
       <span className="text-muted-foreground">/mois</span>
      </div>
     </CardHeader>
     <CardContent>
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
      <Button asChild className="w-full bg-primary hover:bg-primary/90">
       <Link href="/signup?plan=starter">Essayer 14 jours</Link>
      </Button>
     </CardFooter>
    </Card>

    {/* PRO */}
    <Card className="relative">
     <CardHeader>
      <CardTitle className="text-2xl">Pro</CardTitle>
      <CardDescription>Pour équipes</CardDescription>
      <div className="mt-4">
       <span className="text-4xl font-bold">49€</span>
       <span className="text-muted-foreground">/mois</span>
      </div>
     </CardHeader>
     <CardContent>
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
      <Button asChild variant="outline" className="w-full">
       <Link href="/signup?plan=pro">Démarrer</Link>
      </Button>
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
