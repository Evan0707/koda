import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Projets | Documentation KodaFlow',
 description: 'Suivi de projets, gestion des tâches, pointage du temps et dépenses dans KodaFlow.',
}

export default function ProjetsDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Projets</h1>
   <p className="lead">
    Organisez vos projets, suivez vos tâches, pointez votre temps de travail et gérez vos dépenses — le tout rattaché à vos clients.
   </p>

   <hr />

   <h2 id="creer-projet">1. Créer un projet</h2>
   <ol>
    <li>Allez dans <strong>Projets → Nouveau projet</strong>.</li>
    <li>Nommez le projet et rattachez-le à un <strong>client / entreprise</strong>.</li>
    <li>Définissez les dates de début et de fin prévues.</li>
    <li>Ajoutez une description et un budget estimé (optionnel).</li>
   </ol>

   <h2 id="hub-projet">2. Hub projet</h2>
   <p>Chaque projet dispose d'un <strong>hub centralisé</strong> avec plusieurs onglets :</p>
   <ul>
    <li><strong>Vue d'ensemble</strong> — Résumé du projet, avancement, budget consommé.</li>
    <li><strong>Tâches</strong> — Liste et suivi des tâches à réaliser.</li>
    <li><strong>Temps</strong> — Historique des temps pointés sur ce projet.</li>
    <li><strong>Dépenses</strong> — Dépenses liées au projet.</li>
    <li><strong>Devis & Factures</strong> — Documents commerciaux rattachés.</li>
    <li><strong>Contrats</strong> — Contrats associés au projet.</li>
   </ul>

   <h2 id="taches">3. Gestion des tâches</h2>
   <p>Créez et gérez vos tâches directement dans le projet :</p>
   <ul>
    <li>Ajoutez un <strong>titre</strong>, une <strong>description</strong> et une <strong>date d'échéance</strong>.</li>
    <li>Assignez une <strong>priorité</strong> (basse, moyenne, haute, urgente).</li>
    <li>Suivez le statut : <strong>À faire → En cours → Terminé</strong>.</li>
   </ul>

   <h2 id="temps">4. Suivi du temps</h2>
   <p>Pointez le temps passé sur chaque projet :</p>
   <ol>
    <li>Allez dans <strong>Temps</strong> depuis le menu ou depuis l'onglet Temps du projet.</li>
    <li>Créez une entrée en sélectionnant le <strong>projet</strong> et la <strong>tâche</strong> concernée.</li>
    <li>Saisissez la <strong>durée</strong> manuellement.</li>
    <li>Les temps sont agrégés automatiquement dans le hub projet.</li>
   </ol>

   <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Astuce</p>
    <p className="text-blue-700 dark:text-blue-400">Exportez vos temps au format CSV pour facturer vos heures à vos clients ou pour votre suivi interne.</p>
   </div>

   <h2 id="depenses">5. Gestion des dépenses</h2>
   <p>Suivez les dépenses liées à vos projets :</p>
   <ul>
    <li>Ajoutez une dépense avec le <strong>montant</strong>, la <strong>catégorie</strong> et le <strong>projet associé</strong>.</li>
    <li>Joignez un <strong>justificatif</strong> (photo ou PDF).</li>
    <li>Les dépenses sont agrégées dans le budget du projet.</li>
    <li>Exportez les dépenses au format CSV.</li>
   </ul>

   <h2 id="produits">6. Catalogue de produits</h2>
   <p>Créez un catalogue de vos services et produits récurrents :</p>
   <ul>
    <li>Définissez des <strong>produits types</strong> avec prix, description et TVA.</li>
    <li>Réutilisez-les dans vos devis et factures en un clic.</li>
    <li>Gain de temps considérable si vous vendez les mêmes prestations régulièrement.</li>
   </ul>
  </article>
 )
}
