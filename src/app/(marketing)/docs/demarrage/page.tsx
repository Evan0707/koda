import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
 title: 'Démarrage | Documentation KodaFlow',
 description: 'Guide de démarrage pour KodaFlow : création de compte, configuration et premier devis.',
}

export default function DemarragePage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Démarrage</h1>
   <p className="lead">
    Commencez à utiliser KodaFlow en quelques minutes. Ce guide vous accompagne de la création de votre compte à l'envoi de votre premier devis.
   </p>

   <hr />

   <h2 id="creation-compte">1. Créer votre compte</h2>
   <ol>
    <li>Rendez-vous sur <Link href="/signup" className="text-primary">kodaflow.com/signup</Link>.</li>
    <li>Entrez votre adresse email et choisissez un mot de passe sécurisé (8 caractères minimum, majuscule, minuscule, chiffre).</li>
    <li>Vérifiez votre email en cliquant sur le lien de confirmation.</li>
    <li>Connectez-vous et vous serez redirigé vers l'assistant de configuration.</li>
   </ol>

   <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Astuce</p>
    <p className="text-blue-700 dark:text-blue-400">Le plan Gratuit vous donne accès à toutes les fonctionnalités essentielles sans limite de durée. Vous pouvez passer à un plan payant à tout moment.</p>
   </div>

   <h2 id="onboarding">2. Configuration initiale (Onboarding)</h2>
   <p>Lors de votre première connexion, un assistant vous guide en quelques étapes :</p>
   <ol>
    <li><strong>Nom de votre organisation</strong> — le nom de votre entreprise ou activité.</li>
    <li><strong>Informations légales</strong> — SIRET, adresse, forme juridique. Ces informations apparaîtront sur vos devis et factures.</li>
    <li><strong>Logo</strong> — Uploadez votre logo pour personnaliser vos documents.</li>
    <li><strong>Numérotation</strong> — Choisissez le format de numérotation de vos devis et factures (ex: FAC-2026-001).</li>
   </ol>

   <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">⚠️ Important</p>
    <p className="text-amber-700 dark:text-amber-400">Vos informations légales (SIRET, adresse) sont obligatoires pour que vos factures soient conformes à la réglementation française.</p>
   </div>

   <h2 id="premier-devis">3. Envoyer votre premier devis</h2>
   <ol>
    <li>Allez dans <strong>Devis → Nouveau devis</strong>.</li>
    <li>Sélectionnez ou créez un client à la volée.</li>
    <li>Ajoutez des lignes de produits/services avec quantités et prix unitaires.</li>
    <li>Prévisualisez le devis, puis cliquez sur <strong>Enregistrer</strong>.</li>
    <li>Envoyez-le par email ou partagez le <strong>lien de signature</strong> avec votre client.</li>
   </ol>

   <h2 id="navigation">4. Naviguer dans KodaFlow</h2>
   <p>Le menu latéral (sidebar) est organisé en sections :</p>
   <ul>
    <li><strong>Dashboard</strong> — Vue d'ensemble de votre activité, chiffre d'affaires, tâches récentes.</li>
    <li><strong>CRM</strong> — Contacts et Pipeline commercial.</li>
    <li><strong>Commercial</strong> — Devis, Factures et Contrats.</li>
    <li><strong>Gestion</strong> — Projets, Produits, Temps et Dépenses.</li>
   </ul>

   <h2 id="etapes-suivantes">5. Et ensuite ?</h2>
   <p>Maintenant que vous êtes opérationnel :</p>
   <ul>
    <li><Link href="/docs/contacts">Importez vos contacts existants</Link> via CSV.</li>
    <li><Link href="/docs/parametres">Connectez Gmail et Stripe</Link> pour envoyer vos emails et recevoir des paiements.</li>
    <li><Link href="/docs/projets">Créez votre premier projet</Link> et commencez à suivre votre temps.</li>
   </ul>
  </article>
 )
}
