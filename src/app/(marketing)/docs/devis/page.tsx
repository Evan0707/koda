import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Devis | Documentation KodaFlow',
 description: 'Créer, envoyer et faire signer vos devis avec KodaFlow. Génération IA, signature électronique et conversion en facture.',
}

export default function DevisDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Devis</h1>
   <p className="lead">
    Créez des devis professionnels en quelques clics, faites-les signer électroniquement et convertissez-les en factures automatiquement.
   </p>

   <hr />

   <h2 id="creer-devis">1. Créer un devis</h2>
   <ol>
    <li>Allez dans <strong>Devis → Nouveau devis</strong>.</li>
    <li>Sélectionnez un <strong>contact</strong> ou une <strong>entreprise</strong> destinataire.</li>
    <li>Ajoutez un objet et une description (optionnel).</li>
    <li>Ajoutez des <strong>lignes de produits/services</strong> :
     <ul>
      <li>Description, quantité, prix unitaire HT, taux de TVA.</li>
      <li>Vous pouvez sélectionner depuis votre <strong>catalogue de produits</strong> ou saisir manuellement.</li>
     </ul>
    </li>
    <li>Les totaux (HT, TVA, TTC) sont calculés automatiquement.</li>
    <li>Cliquez sur <strong>Enregistrer</strong> pour créer le devis en brouillon.</li>
   </ol>

   <h2 id="generation-ia">2. Génération avec l'IA</h2>
   <p>Sur les plans <strong>Starter</strong> et <strong>Pro</strong>, vous pouvez utiliser l'IA pour :</p>
   <ul>
    <li><strong>Générer un devis complet</strong> à partir d'une simple description de votre prestation.</li>
    <li>L'IA propose les lignes, quantités, prix et descriptions adaptés.</li>
    <li>Vous gardez le contrôle : modifiez, ajoutez ou supprimez des lignes avant d'enregistrer.</li>
   </ul>

   <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-violet-800 dark:text-violet-300 mb-1">✨ Fonctionnalité IA</p>
    <p className="text-violet-700 dark:text-violet-400">Cliquez sur « Générer avec l'IA » lors de la création d'un devis. Décrivez votre prestation en quelques phrases et l'IA fait le reste.</p>
   </div>

   <h2 id="envoyer-devis">3. Envoyer un devis</h2>
   <p>Plusieurs options pour envoyer votre devis :</p>
   <ul>
    <li><strong>Par email</strong> — Si Gmail est connecté, envoyez directement depuis KodaFlow. L'IA peut rédiger l'email d'accompagnement pour vous.</li>
    <li><strong>Lien de signature</strong> — Générez un lien unique et partagez-le par le canal de votre choix.</li>
    <li><strong>PDF</strong> — Imprimez ou téléchargez le devis en PDF via le bouton Imprimer.</li>
   </ul>

   <h2 id="signature">4. Signature électronique</h2>
   <p>Vos clients peuvent signer vos devis en ligne :</p>
   <ol>
    <li>Le client ouvre le lien de signature reçu.</li>
    <li>Il visualise le devis complet.</li>
    <li>Il signe avec son doigt (mobile) ou sa souris (desktop).</li>
    <li>Le devis passe automatiquement au statut <strong>« Accepté »</strong>.</li>
   </ol>

   <h2 id="statuts">5. Statuts des devis</h2>
   <ul>
    <li><strong>Brouillon</strong> — En cours de rédaction, non envoyé.</li>
    <li><strong>Envoyé</strong> — Transmis au client, en attente de réponse.</li>
    <li><strong>Accepté</strong> — Signé par le client.</li>
    <li><strong>Refusé</strong> — Décliné par le client.</li>
    <li><strong>Expiré</strong> — Date de validité dépassée.</li>
   </ul>

   <h2 id="convertir-facture">6. Convertir en facture</h2>
   <p>Une fois un devis accepté, vous pouvez le convertir en facture en un clic :</p>
   <ol>
    <li>Ouvrez le devis accepté.</li>
    <li>Cliquez sur <strong>« Convertir en facture »</strong>.</li>
    <li>Toutes les lignes, montants et informations client sont automatiquement reportés.</li>
    <li>La facture est créée en brouillon pour une dernière vérification avant envoi.</li>
   </ol>

   <h2 id="archivage">7. Archivage et suppression</h2>
   <p>Les devis supprimés sont conservés dans la <strong>corbeille</strong> pendant 30 jours avant suppression définitive. Vous pouvez les restaurer à tout moment durant cette période.</p>
  </article>
 )
}
