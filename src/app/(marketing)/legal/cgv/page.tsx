import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Conditions Générales de Vente et d\'Utilisation | KodaFlow',
 description: 'CGV et CGU de KodaFlow',
}

export default function CGVPage() {
 return (
  <div className="container py-12 md:py-24 max-w-4xl mx-auto px-4">
   <div className="space-y-8">
    <div>
     <h1 className="text-3xl font-bold tracking-tight mb-4">Conditions Générales de Vente et d'Utilisation</h1>
     <p className="text-muted-foreground text-lg">
      Dernière mise à jour : 28/02/2026
     </p>
    </div>

    <div className="prose prose-slate dark:prose-invert max-w-none">
     <p className="lead mb-8">
      Les présentes Conditions Générales (ci-après les "CGV/CGU") régissent l'accès et l'utilisation du service KodaFlow,
      application SaaS de gestion à destination des freelances, agences et consultants.
     </p>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 1 - Objet</h2>
      <p>
       KodaFlow fournit un logiciel en tant que service (SaaS) permettant de gérer :
       les contacts (CRM), la création et signature de devis, la facturation, et le suivi de projets.
       Les présentes conditions définissent les droits et obligations des parties dans le cadre de l'utilisation de la plateforme.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 2 - Accès au service</h2>
      <p>
       L'accès aux services KodaFlow nécessite la création d'un compte utilisateur.
       Le client s'engage à fournir des informations exactes lors de son inscription et à maintenir à jour ses coordonnées.
       Les identifiants de connexion sont strictement personnels et confidentiels.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 3 - Essai gratuit</h2>
      <p>
       Les plans payants (Starter et Pro) bénéficient d'une période d'essai gratuit de 14 jours.
       À l'issue de cette période, l'utilisateur sera automatiquement facturé selon le plan choisi,
       sauf s'il annule avant la fin de l'essai. Un plan Gratuit avec des fonctionnalités limitées
       est également disponible sans limite de durée.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 4 - Tarifs et abonnements</h2>
      <p>
       A la fin de l'éventuelle période d'essai gratuit, l'utilisation de KodaFlow sera soumise à la souscription d'un abonnement payant.
       Les tarifs applicables seront ceux affichés sur le site au moment de la souscription.
       Les paiements sont traités de manière sécurisée par notre prestataire de paiement (Stripe).
       Les abonnements sont sans engagement et peuvent être annulés à tout moment.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 5 - Obligations de l'utilisateur</h2>
      <p>
       L'utilisateur s'engage à :
      </p>
      <ul className="list-disc pl-6 space-y-2 mt-2">
       <li>Utiliser KodaFlow dans le strict respect de la loi et des réglementations en vigueur.</li>
       <li>Ne pas utiliser le service pour émettre de faux documents (fausses factures, etc.). KodaFlow n'est qu'un outil d'édition technique et ne saurait être tenu responsable du contenu des documents générés par l'utilisateur.</li>
       <li>Respecter le RGPD vis-à-vis des données personnelles de ses propres clients importées dans le CRM KodaFlow.</li>
      </ul>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 6 - Propriété et Données</h2>
      <p>
       Les données intégrées par l'utilisateur dans KodaFlow (clients, catalogues, devis, factures) restent sa propriété exclusive.
       KodaFlow garantit la réversibilité des données : l'utilisateur pourra exporter ses données sous un format standard (CSV/Excel).
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 7 - Responsabilité et Disponibilité</h2>
      <p>
       KodaFlow s'efforce d'assurer une disponibilité du service de 99%, 7 jours sur 7.
       Néanmoins, l'éditeur ne saurait être tenu responsable des problèmes techniques (coupures internet, maintenance exceptionnelle)
       indépendants de sa volonté causant une interruption du service.
      </p>
      <p>
       La responsabilité de KodaFlow est strictement limitée au montant des sommes versées par le client au cours des 12 derniers mois.
      </p>
     </section>

     <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">Article 8 - Droit applicable et Litiges</h2>
      <p>
       Les présentes CGV/CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable,
       le tribunal compétent sera celui du siège social de l'éditeur de KodaFlow.
      </p>
     </section>
    </div>
   </div>
  </div>
 )
}
