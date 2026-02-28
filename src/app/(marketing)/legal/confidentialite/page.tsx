import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Politique de Confidentialité | KodaFlow',
 description: 'Politique de confidentialité et gestion des données pour KodaFlow',
}

export default function PrivacyPolicyPage() {
 return (
  <div className="container py-12 md:py-24 max-w-4xl mx-auto px-4">
   <div className="space-y-8">
    <div>
     <h1 className="text-3xl font-bold tracking-tight mb-4">Politique de Confidentialité</h1>
     <p className="text-muted-foreground text-lg">
      Dernière mise à jour : 28/02/2026
     </p>
    </div>

    <div className="prose prose-slate dark:prose-invert max-w-none">
     <p className="lead mb-8">
      Chez KodaFlow, la protection de vos données personnelles est une priorité.
      Cette politique de confidentialité vous explique comment nous collectons, utilisons, transférons et protégeons vos données.
     </p>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">1. Données collectées</h2>
      <p>
       Nous collectons les données suivantes :
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
       <li><strong>Données d'identification :</strong> Nom, prénom, adresse email lors de la création de compte.</li>
       <li><strong>Données professionnelles :</strong> Informations de votre entreprise, SIRET, adresse, contacts de vos clients, nécessaires au fonctionnement du CRM et de la facturation.</li>
       <li><strong>Données techniques :</strong> Adresses IP, logs de connexion, appareils utilisés, principalement via Supabase (notre base de données) et Vercel (notre hébergeur).</li>
      </ul>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">2. Finalités du traitement</h2>
      <p>
       Vos données sont traitées pour :
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
       <li>Permettre l'utilisation de la plateforme KodaFlow (création de devis, factures, CRM).</li>
       <li>Gérer la facturation et les paiements via Stripe.</li>
       <li>Améliorer nos services et développer de nouvelles fonctionnalités.</li>
       <li>Vous contacter pour du support technique ou des informations importantes concernant votre compte.</li>
      </ul>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">3. Partage des données</h2>
      <p>
       Vos données ne sont jamais vendues à des tierces parties. Elles sont partagées uniquement avec les sous-traitants strictement nécessaires au bon fonctionnement de l'application :
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
       <li><strong>Supabase :</strong> Hébergement et sécurisation de la base de données.</li>
       <li><strong>Stripe :</strong> Traitement des paiements sécurisés.</li>
       <li><strong>Vercel :</strong> Hébergement de l'application web.</li>
       <li><strong>Outils IA (ex: Groq) :</strong> Uniquement si vous utilisez nos fonctionnalités d'IA générative (les données envoyées ne servent pas à entraîner leurs modèles).</li>
      </ul>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">4. Conservation des données</h2>
      <p>
       Vos données sont conservées tant que votre compte est actif. Conformément à la législation, les données de facturation (factures) sont conservées pendant 10 ans. En cas de suppression de compte, vos données personnelles seront supprimées dans un délai maximum de 30 jours, à l'exception des données comptables obligatoires.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">5. Vos droits (RGPD)</h2>
      <p>
       Conformément à la réglementation (RGPD), vous disposez des droits suivants concernant vos données :
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
       <li>Droit d'accès et de rectification.</li>
       <li>Droit à l'effacement (« droit à l'oubli »).</li>
       <li>Droit à la limitation du traitement.</li>
       <li>Droit à la portabilité (export de vos données).</li>
      </ul>
      <p className="mt-4">
       Pour exercer ces droits, veuillez nous contacter à l'adresse suivante : <strong>contact@kodaflow.com</strong>.
      </p>
     </section>
    </div>
   </div>
  </div>
 )
}
