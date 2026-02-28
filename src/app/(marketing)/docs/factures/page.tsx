import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Factures | Documentation KodaFlow',
 description: 'Gestion des factures avec KodaFlow : création, envoi, paiement en ligne, export comptable et FEC.',
}

export default function FacturesDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Factures</h1>
   <p className="lead">
    Créez des factures conformes, envoyez-les à vos clients, recevez les paiements en ligne et exportez vos données pour la comptabilité.
   </p>

   <hr />

   <h2 id="creer-facture">1. Créer une facture</h2>
   <ol>
    <li>Allez dans <strong>Factures → Nouvelle facture</strong>.</li>
    <li>Sélectionnez le client ou l'entreprise destinataire.</li>
    <li>Ajoutez les lignes de prestations (description, quantité, prix unitaire, TVA).</li>
    <li>Définissez la <strong>date d'émission</strong> et la <strong>date d'échéance</strong>.</li>
    <li>Enregistrez. La numérotation est automatique et séquentielle.</li>
   </ol>

   <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">⚠️ Important</p>
    <p className="text-amber-700 dark:text-amber-400">La numérotation des factures doit être séquentielle et sans rupture, conformément à la législation française. KodaFlow gère cela automatiquement.</p>
   </div>

   <h2 id="envoyer-facture">2. Envoyer une facture</h2>
   <ul>
    <li><strong>Par email</strong> — Envoyez directement depuis KodaFlow si Gmail est connecté. L'IA peut rédiger l'email d'envoi.</li>
    <li><strong>Lien de paiement</strong> — Copiez le lien de paiement pour le partager avec votre client.</li>
    <li><strong>PDF</strong> — Imprimez ou exportez en PDF via le bouton « Imprimer / PDF ».</li>
   </ul>

   <h2 id="paiement-ligne">3. Paiement en ligne (Stripe)</h2>
   <p>Si Stripe est configuré dans vos paramètres, vos clients peuvent payer en ligne :</p>
   <ol>
    <li>Le client reçoit le <strong>lien de paiement</strong>.</li>
    <li>Il visualise la facture et clique sur <strong>« Payer »</strong>.</li>
    <li>Paiement sécurisé par carte bancaire via Stripe.</li>
    <li>La facture passe automatiquement au statut <strong>« Payée »</strong>.</li>
   </ol>

   <h2 id="statuts-facture">4. Statuts des factures</h2>
   <ul>
    <li><strong>Brouillon</strong> — En cours de rédaction.</li>
    <li><strong>Envoyée</strong> — Transmise au client.</li>
    <li><strong>Payée</strong> — Paiement reçu.</li>
    <li><strong>En retard</strong> — Date d'échéance dépassée sans paiement.</li>
    <li><strong>Annulée</strong> — Facture annulée.</li>
   </ul>

   <h2 id="export">5. Export comptable</h2>
   <p>KodaFlow vous permet d'exporter vos données de facturation pour votre comptable :</p>
   <ul>
    <li><strong>Export CSV</strong> — Téléchargez la liste de vos factures en CSV filtrable.</li>
    <li><strong>Export FEC</strong> — Fichier des Écritures Comptables au format réglementaire, prêt pour votre expert-comptable.</li>
   </ul>

   <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Astuce</p>
    <p className="text-blue-700 dark:text-blue-400">Vous pouvez filtrer vos exports par période (mensuel, trimestriel, annuel) pour faciliter vos déclarations.</p>
   </div>

   <h2 id="depuis-devis">6. Créer une facture depuis un devis</h2>
   <p>
    Consultez la section <Link href="/docs/devis#convertir-facture">Convertir un devis en facture</Link> pour convertir un devis accepté en facture en un clic.
   </p>

   <h2 id="archivage">7. Archivage</h2>
   <p>Les factures supprimées sont conservées dans la corbeille pendant 30 jours. Conformément à la loi, les factures émises restent accessibles dans vos exports comptables même après suppression.</p>
  </article>
 )
}
