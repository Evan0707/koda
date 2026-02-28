import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Contacts & CRM | Documentation KodaFlow',
 description: 'Gérer vos contacts, entreprises, tags, import CSV et pipeline commercial dans KodaFlow.',
}

export default function ContactsDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Contacts & CRM</h1>
   <p className="lead">
    Le CRM de KodaFlow centralise vos contacts et entreprises, et vous permet de suivre vos opportunités commerciales dans un pipeline visuel.
   </p>

   <hr />

   <h2 id="ajouter-contact">1. Ajouter un contact</h2>
   <ol>
    <li>Allez dans <strong>Contacts</strong> depuis le menu latéral.</li>
    <li>Cliquez sur <strong>Nouveau contact</strong>.</li>
    <li>Renseignez les informations : nom, prénom, email, téléphone, entreprise.</li>
    <li>Ajoutez des <strong>tags</strong> pour organiser vos contacts (ex: « Client », « Prospect », « Partenaire »).</li>
    <li>Enregistrez.</li>
   </ol>

   <h2 id="entreprises">2. Gérer les entreprises</h2>
   <p>Les entreprises regroupent vos contacts par société. Pour chaque entreprise, vous pouvez renseigner :</p>
   <ul>
    <li><strong>Nom commercial</strong> et <strong>SIRET</strong>.</li>
    <li><strong>Adresse</strong> complète (utilisée automatiquement sur vos devis et factures).</li>
    <li><strong>Contacts associés</strong> — plusieurs contacts peuvent appartenir à la même entreprise.</li>
   </ul>

   <h2 id="import-csv">3. Importer des contacts (CSV)</h2>
   <p>Si vous avez des contacts dans un autre outil, vous pouvez les importer en masse :</p>
   <ol>
    <li>Allez dans <strong>Contacts → Importer</strong>.</li>
    <li>Téléchargez le <strong>modèle CSV</strong> fourni.</li>
    <li>Remplissez-le avec vos données (nom, email, téléphone, entreprise…).</li>
    <li>Uploadez le fichier et validez l'import.</li>
   </ol>

   <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Astuce</p>
    <p className="text-blue-700 dark:text-blue-400">Les tags et entreprises sont créés automatiquement lors de l'import s'ils n'existent pas encore.</p>
   </div>

   <h2 id="tags">4. Organiser avec les tags</h2>
   <p>Les tags vous permettent de segmenter vos contacts :</p>
   <ul>
    <li>Créez des tags personnalisés depuis la fiche contact.</li>
    <li>Filtrez la liste des contacts par tag.</li>
    <li>Exemples d'usage : « Lead chaud », « Client actif », « Ancien client », « Prescripteur ».</li>
   </ul>

   <h2 id="pipeline">5. Pipeline commercial</h2>
   <p>Le pipeline vous donne une vue Kanban de vos opportunités commerciales :</p>
   <ol>
    <li>Allez dans <strong>Pipeline</strong> depuis le menu CRM.</li>
    <li>Créez une <strong>nouvelle opportunité</strong> en la rattachant à un contact.</li>
    <li>Renseignez le montant estimé, la probabilité de conversion et la date de clôture prévue.</li>
    <li><strong>Glissez-déposez</strong> les cartes entre les colonnes pour suivre leur progression.</li>
   </ol>
   <p>Les colonnes par défaut sont :</p>
   <ul>
    <li><strong>Nouveau</strong> → <strong>Qualifié</strong> → <strong>Proposition</strong> → <strong>Négociation</strong> → <strong>Gagné / Perdu</strong></li>
   </ul>

   <h2 id="fiche-contact">6. Fiche contact détaillée</h2>
   <p>Chaque contact dispose d'une fiche complète avec :</p>
   <ul>
    <li>Historique des <strong>devis et factures</strong> liés.</li>
    <li><strong>Opportunités</strong> en cours.</li>
    <li><strong>Notes et activités</strong> pour garder une trace de vos échanges.</li>
   </ul>
  </article>
 )
}
