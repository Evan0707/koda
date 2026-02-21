import { PricingToggle } from './pricing-toggle'
import { TRIAL_DAYS } from '@/lib/utils/plan-limits'

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

   <PricingToggle />

   {/* FAQ Section */}
   <div className="mt-20 max-w-3xl mx-auto">
    <h2 className="text-3xl font-bold text-center mb-8">Questions fréquentes</h2>
    <div className="space-y-6">
     <FAQItem
      question="Comment fonctionne la commission sur le plan gratuit ?"
      answer="Sur le plan FREE, nous prenons une commission de 5% sur chaque paiement Stripe. Par exemple, si votre client paie 100€, vous recevez 95€ et nous gardons 5€. Les plans payants n'ont aucune commission."
     />
     <FAQItem
      question={`Comment fonctionne l'essai gratuit de ${TRIAL_DAYS} jours ?`}
      answer={`Lorsque vous souscrivez à un plan Starter ou Pro pour la première fois, vous bénéficiez de ${TRIAL_DAYS} jours d'essai gratuit. Aucun paiement ne sera prélevé pendant cette période. Si vous annulez avant la fin de l'essai, vous ne serez pas facturé.`}
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

function FAQItem({ question, answer }: { question: string; answer: string }) {
 return (
  <div className="border-b pb-6">
   <h3 className="font-semibold text-lg mb-2">{question}</h3>
   <p className="text-muted-foreground">{answer}</p>
  </div>
 )
}
