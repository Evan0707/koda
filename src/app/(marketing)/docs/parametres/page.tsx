import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Paramètres | Documentation KodaFlow',
 description: 'Configuration de votre compte KodaFlow : profil, organisation, intégrations Gmail et Stripe, membres d\'équipe.',
}

export default function ParametresDocPage() {
 return (
  <article className="max-w-3xl mx-auto prose prose-slate dark:prose-invert">
   <h1>Paramètres</h1>
   <p className="lead">
    Configurez votre compte, personnalisez votre organisation et connectez vos outils externes.
   </p>

   <hr />

   <h2 id="profil">1. Profil utilisateur</h2>
   <p>Dans <strong>Paramètres → Profil</strong>, vous pouvez :</p>
   <ul>
    <li>Modifier votre <strong>nom</strong> et votre <strong>avatar</strong>.</li>
    <li>Changer votre <strong>adresse email</strong>.</li>
    <li>Modifier votre <strong>mot de passe</strong>.</li>
   </ul>

   <h2 id="organisation">2. Organisation</h2>
   <p>Dans <strong>Paramètres → Organisation</strong>, configurez les informations de votre entreprise :</p>
   <ul>
    <li><strong>Nom commercial</strong> et <strong>logo</strong> — affichés sur vos devis et factures.</li>
    <li><strong>Adresse</strong> — postale complète.</li>
    <li><strong>SIRET</strong> et <strong>numéro de TVA</strong>.</li>
    <li><strong>Email de contact</strong> et <strong>téléphone</strong>.</li>
    <li><strong>Numérotation</strong> — format de vos factures et devis (préfixe, compteur).</li>
   </ul>

   <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">⚠️ Important</p>
    <p className="text-amber-700 dark:text-amber-400">Veillez à renseigner toutes vos informations légales. Elles sont obligatoires pour que vos factures soient conformes à la réglementation.</p>
   </div>

   <h2 id="gmail">3. Intégration Gmail</h2>
   <p>Connectez votre compte Gmail pour envoyer vos emails depuis KodaFlow :</p>
   <ol>
    <li>Allez dans <strong>Paramètres → Intégrations</strong>.</li>
    <li>Cliquez sur <strong>« Connecter Gmail »</strong>.</li>
    <li>Autorisez l'accès dans la pop-up Google.</li>
    <li>Une fois connecté, tous les emails (envoi de devis, factures, relances) partiront de votre adresse Gmail.</li>
   </ol>

   <h2 id="stripe">4. Intégration Stripe</h2>
   <p>Acceptez les paiements en ligne en connectant Stripe :</p>
   <ol>
    <li>Allez dans <strong>Paramètres → Paiements</strong>.</li>
    <li>Cliquez sur <strong>« Connecter Stripe »</strong>.</li>
    <li>Suivez le processus Stripe Connect pour lier votre compte.</li>
    <li>Vos clients pourront payer par carte bancaire via les liens de paiement.</li>
   </ol>

   <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 not-prose text-sm">
    <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Astuce</p>
    <p className="text-blue-700 dark:text-blue-400">Stripe prélève des frais de transaction standard. KodaFlow ne prend aucune commission supplémentaire sur vos paiements.</p>
   </div>

   <h2 id="equipe">5. Membres d'équipe</h2>
   <p>Invitez des collaborateurs dans votre organisation :</p>
   <ol>
    <li>Allez dans <strong>Paramètres → Membres</strong>.</li>
    <li>Cliquez sur <strong>« Inviter un membre »</strong>.</li>
    <li>Entrez l'adresse email du collaborateur.</li>
    <li>Choisissez le <strong>rôle</strong> :
     <ul>
      <li><strong>Propriétaire</strong> — Accès complet, gestion de l'abonnement et des membres.</li>
      <li><strong>Admin</strong> — Accès complet sauf gestion de l'abonnement.</li>
      <li><strong>Membre</strong> — Accès limité aux opérations courantes.</li>
     </ul>
    </li>
   </ol>

   <h2 id="securite">6. Sécurité</h2>
   <ul>
    <li><strong>Changer le mot de passe</strong> — Depuis l'onglet Sécurité.</li>
    <li><strong>Supprimer le compte</strong> — Suppression définitive de votre compte et de toutes vos données.</li>
    <li><strong>Logs d'audit</strong> — Historique de toutes les actions effectuées dans votre organisation.</li>
   </ul>

   <h2 id="apparence">7. Apparence</h2>
   <p>KodaFlow s'adapte à vos préférences :</p>
   <ul>
    <li><strong>Thème clair</strong> ou <strong>sombre</strong> — switch automatique ou manuel.</li>
    <li>Le thème suit les préférences de votre système par défaut.</li>
   </ul>
  </article>
 )
}
