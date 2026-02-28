import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Abonnement | Documentation KodaFlow',
 description: 'Plans Gratuit, Starter et Pro de KodaFlow. Essai gratuit, changement de plan et facturation.',
}

export default function AbonnementDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Abonnement</h1>
   <p className="lead">
    KodaFlow propose trois plans adaptés à votre activité. Commencez gratuitement et évoluez à votre rythme.
   </p>

   <hr />

   <h2 id="plans">1. Les plans</h2>

   <h3>Gratuit — 0 €/mois</h3>
   <p>Idéal pour démarrer. Inclut :</p>
   <ul>
    <li>10 factures / mois</li>
    <li>10 devis / mois</li>
    <li>50 contacts</li>
    <li>5 projets</li>
    <li>Accès à toutes les fonctionnalités de base</li>
   </ul>

   <h3>Starter — 19 €/mois <span className="text-sm font-normal text-muted-foreground">(ou 190 €/an)</span></h3>
   <p>Pour les freelances en croissance :</p>
   <ul>
    <li>100 factures / mois</li>
    <li>100 devis / mois</li>
    <li>500 contacts</li>
    <li>50 projets</li>
    <li>Fonctionnalités IA (génération de devis, emails)</li>
    <li>Pipeline commercial</li>
   </ul>

   <h3>Pro — 49 €/mois <span className="text-sm font-normal text-muted-foreground">(ou 490 €/an)</span></h3>
   <p>Pour les professionnels exigeants :</p>
   <ul>
    <li>Factures, devis, contacts et projets <strong>illimités</strong></li>
    <li>Toutes les fonctionnalités IA</li>
    <li>Export FEC comptable</li>
    <li>Support prioritaire</li>
   </ul>

   <h2 id="essai-gratuit">2. Essai gratuit</h2>
   <p>Les plans <strong>Starter</strong> et <strong>Pro</strong> bénéficient d'un <strong>essai gratuit de 14 jours</strong> :</p>
   <ul>
    <li>Aucune carte bancaire requise pour commencer.</li>
    <li>Accès complet à toutes les fonctionnalités du plan.</li>
    <li>À la fin de l'essai : passage automatique au plan Gratuit si pas de paiement, ou début de la facturation.</li>
   </ul>

   <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-green-800 dark:text-green-300 mb-1">✅ Sans engagement</p>
    <p className="text-green-700 dark:text-green-400">Tous les abonnements sont sans engagement. Vous pouvez annuler à tout moment depuis vos paramètres.</p>
   </div>

   <h2 id="changer-plan">3. Changer de plan</h2>
   <ol>
    <li>Allez dans <strong>Paramètres → Abonnement</strong>.</li>
    <li>Cliquez sur <strong>« Changer de plan »</strong>.</li>
    <li>Sélectionnez le nouveau plan et la période de facturation (mensuel ou annuel).</li>
    <li>Le changement est immédiat. La facturation est ajustée au prorata.</li>
   </ol>

   <h2 id="facturation">4. Facturation</h2>
   <ul>
    <li>Paiement sécurisé par <strong>carte bancaire via Stripe</strong>.</li>
    <li>Facturation mensuelle ou annuelle (2 mois offerts sur l'annuel).</li>
    <li>Vos factures d'abonnement sont disponibles dans le <strong>portail Stripe</strong>.</li>
   </ul>

   <h2 id="annuler">5. Annuler son abonnement</h2>
   <ol>
    <li>Allez dans <strong>Paramètres → Abonnement</strong>.</li>
    <li>Cliquez sur <strong>« Annuler l'abonnement »</strong>.</li>
    <li>Votre accès premium continue jusqu'à la fin de la période en cours.</li>
    <li>Ensuite, votre compte passe automatiquement au plan Gratuit.</li>
    <li>Vos données sont conservées. Vous pouvez vous réabonner à tout moment.</li>
   </ol>
  </article>
 )
}
