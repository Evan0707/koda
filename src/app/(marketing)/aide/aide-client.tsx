'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
 Search,
 ChevronDown,
 ChevronRight,
 Mail,
 MessageCircle,
 BookOpen,
 Rocket,
 Users,
 FileText,
 Receipt,
 FolderKanban,
 CreditCard,
 Settings,
 ArrowLeft,
 ArrowRight,
} from 'lucide-react'
import { ThemeLogo } from '@/components/theme-logo'

const faqCategories = [
 {
  name: 'Premiers pas',
  icon: Rocket,
  questions: [
   {
    q: 'Comment créer mon compte KodaFlow ?',
    a: 'Rendez-vous sur kodaflow.com/signup, entrez votre email et un mot de passe sécurisé (8 caractères min, majuscule, minuscule, chiffre). Confirmez votre email via le lien reçu, puis connectez-vous.',
   },
   {
    q: 'Le plan Gratuit est-il vraiment gratuit ?',
    a: 'Oui, le plan Gratuit est 100% gratuit, sans limite de durée et sans carte bancaire requise. Il inclut 10 factures/mois, 10 devis/mois, 50 contacts et 5 projets.',
   },
   {
    q: 'Comment configurer mes informations d\'entreprise ?',
    a: 'Lors de votre première connexion, un assistant vous guide. Vous pouvez aussi les modifier à tout moment dans Paramètres → Organisation (nom, SIRET, adresse, logo, numérotation).',
   },
  ],
 },
 {
  name: 'Devis & Factures',
  icon: FileText,
  questions: [
   {
    q: 'Comment envoyer un devis à mon client ?',
    a: 'Créez votre devis, puis envoyez-le par email (si Gmail est connecté) ou partagez le lien de signature. Votre client pourra le consulter et le signer en ligne.',
   },
   {
    q: 'Comment convertir un devis en facture ?',
    a: 'Ouvrez un devis au statut "Accepté", puis cliquez sur "Convertir en facture". Toutes les lignes et informations sont automatiquement reportées.',
   },
   {
    q: 'Comment recevoir un paiement en ligne ?',
    a: 'Connectez Stripe dans Paramètres → Paiements. Vos factures incluront un lien de paiement. Le client paie par carte et la facture passe automatiquement en "Payée".',
   },
   {
    q: 'Comment exporter mes factures pour mon comptable ?',
    a: 'Dans Factures, utilisez "Export CSV" pour un tableau filtrable, ou "Export FEC" pour le Fichier des Écritures Comptables au format réglementaire.',
   },
   {
    q: 'L\'IA peut-elle rédiger mes devis ?',
    a: 'Oui ! Sur les plans Starter et Pro, cliquez sur "Générer avec l\'IA" lors de la création d\'un devis. Décrivez votre prestation et l\'IA propose les lignes, quantités et prix.',
   },
  ],
 },
 {
  name: 'Contacts & CRM',
  icon: Users,
  questions: [
   {
    q: 'Comment importer mes contacts existants ?',
    a: 'Allez dans Contacts → Importer. Téléchargez le modèle CSV, remplissez-le avec vos données, puis uploadez-le. Tags et entreprises sont créés automatiquement.',
   },
   {
    q: 'Comment fonctionne le pipeline commercial ?',
    a: 'Le pipeline est une vue Kanban de vos opportunités. Créez des opportunités rattachées à vos contacts, puis glissez-déposez les cartes entre colonnes (Nouveau → Qualifié → Proposition → Gagné/Perdu).',
   },
  ],
 },
 {
  name: 'Projets & Suivi',
  icon: FolderKanban,
  questions: [
   {
    q: 'Comment suivre mon temps de travail ?',
    a: 'Dans Temps, créez une entrée en sélectionnant un projet et une tâche. Saisissez la durée. Les temps sont agrégés dans le hub projet et exportables en CSV.',
   },
   {
    q: 'Comment gérer mes dépenses ?',
    a: 'Dans Dépenses, ajoutez une dépense avec le montant, la catégorie et le projet associé. Vous pouvez joindre un justificatif et exporter en CSV.',
   },
  ],
 },
 {
  name: 'Abonnement & Paiement',
  icon: CreditCard,
  questions: [
   {
    q: 'Y a-t-il un essai gratuit pour les plans payants ?',
    a: 'Oui, les plans Starter (19€/mois) et Pro (49€/mois) offrent un essai gratuit de 14 jours. Aucune carte bancaire n\'est requise pour commencer.',
   },
   {
    q: 'Comment changer de plan ?',
    a: 'Allez dans Paramètres → Abonnement → Changer de plan. Le changement est immédiat et la facturation ajustée au prorata.',
   },
   {
    q: 'Comment annuler mon abonnement ?',
    a: 'Dans Paramètres → Abonnement, cliquez sur "Annuler". Votre accès premium continue jusqu\'à la fin de la période. Ensuite, vous passez au plan Gratuit sans perdre vos données.',
   },
   {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, etc.) via Stripe. Le paiement est 100% sécurisé.',
   },
  ],
 },
 {
  name: 'Intégrations',
  icon: Settings,
  questions: [
   {
    q: 'Comment connecter Gmail ?',
    a: 'Allez dans Paramètres → Intégrations → Connecter Gmail. Autorisez l\'accès via Google. Vos emails de devis et factures partiront ensuite de votre adresse Gmail.',
   },
   {
    q: 'Comment connecter Stripe ?',
    a: 'Allez dans Paramètres → Paiements → Connecter Stripe. Suivez le processus Stripe Connect. Vos clients pourront ensuite payer par carte via les liens de paiement.',
   },
  ],
 },
]

const docLinks = [
 { slug: 'demarrage', label: 'Démarrage', icon: Rocket, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
 { slug: 'contacts', label: 'Contacts & CRM', icon: Users, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
 { slug: 'devis', label: 'Devis', icon: FileText, color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' },
 { slug: 'factures', label: 'Factures', icon: Receipt, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
 { slug: 'projets', label: 'Projets', icon: FolderKanban, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
 { slug: 'abonnement', label: 'Abonnement', icon: CreditCard, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
]

export default function AideClient() {
 const [search, setSearch] = useState('')
 const [openIndex, setOpenIndex] = useState<string | null>(null)

 const allQuestions = faqCategories.flatMap((cat, ci) =>
  cat.questions.map((q, qi) => ({ ...q, category: cat.name, icon: cat.icon, key: `${ci}-${qi}` }))
 )

 const filtered = search.trim()
  ? allQuestions.filter(
   q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
  )
  : null

 return (
  <div className="min-h-screen bg-background">
   {/* Header */}
   <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
     <Link href="/" className="flex items-center gap-2">
      <ThemeLogo className="w-7 h-7" />
      <span className="font-semibold text-foreground">KodaFlow</span>
     </Link>
     <Link href="/signup">
      <button className="text-sm font-medium px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors">
       Démarrer
      </button>
     </Link>
    </div>
   </header>

   <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    {/* Hero */}
    <div className="text-center mb-12">
     <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-5">
      <MessageCircle className="w-8 h-8 text-primary" />
     </div>
     <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
      Centre d'aide
     </h1>
     <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
      Trouvez rapidement des réponses à vos questions.
     </p>

     {/* Search */}
     <div className="relative max-w-xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <input
       type="text"
       placeholder="Rechercher une question..."
       value={search}
       onChange={e => setSearch(e.target.value)}
       className="w-full pl-12 pr-4 py-4 text-base rounded-xl border border-border bg-card shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
      />
     </div>
    </div>

    {/* Search Results */}
    {filtered !== null ? (
     <div className="mb-12">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">
       {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour « {search} »
      </h2>
      {filtered.length === 0 ? (
       <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">Aucun résultat trouvé.</p>
        <p className="text-sm text-muted-foreground">
         Essayez d'autres termes ou{' '}
         <a href="mailto:contact@kodaflow.com" className="text-primary hover:underline">
          contactez-nous
         </a>.
        </p>
       </div>
      ) : (
       <div className="space-y-2">
        {filtered.map(item => (
         <div key={item.key} className="border border-border rounded-xl overflow-hidden bg-card">
          <button
           onClick={() => setOpenIndex(openIndex === item.key ? null : item.key)}
           className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
           <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">{item.category}</span>
            <span className="font-medium text-foreground truncate">{item.q}</span>
           </div>
           {openIndex === item.key ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
           ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
           )}
          </button>
          {openIndex === item.key && (
           <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed animate-fade-in">
            {item.a}
           </div>
          )}
         </div>
        ))}
       </div>
      )}
     </div>
    ) : (
     /* FAQ Categories */
     <div className="space-y-8 mb-16">
      {faqCategories.map((cat, ci) => {
       const Icon = cat.icon
       return (
        <div key={ci}>
         <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">{cat.name}</h2>
         </div>
         <div className="space-y-2">
          {cat.questions.map((faq, qi) => {
           const key = `${ci}-${qi}`
           return (
            <div key={key} className="border border-border rounded-xl overflow-hidden bg-card">
             <button
              onClick={() => setOpenIndex(openIndex === key ? null : key)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
             >
              <span className="font-medium text-foreground pr-4">{faq.q}</span>
              {openIndex === key ? (
               <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
              ) : (
               <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
             </button>
             {openIndex === key && (
              <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed animate-fade-in">
               {faq.a}
              </div>
             )}
            </div>
           )
          })}
         </div>
        </div>
       )
      })}
     </div>
    )}

    {/* Documentation Links */}
    <div className="mb-16">
     <div className="flex items-center gap-2 mb-5">
      <BookOpen className="w-5 h-5 text-primary" />
      <h2 className="text-lg font-semibold text-foreground">Documentation complète</h2>
     </div>
     <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {docLinks.map(link => {
       const Icon = link.icon
       return (
        <Link
         key={link.slug}
         href={`/docs/${link.slug}`}
         className="group flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-card"
        >
         <div className={`p-2 rounded-lg shrink-0 ${link.color}`}>
          <Icon className="w-4 h-4" />
         </div>
         <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
          {link.label}
         </span>
         <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
       )
      })}
     </div>
    </div>

    {/* Contact Support */}
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-8 sm:p-10 text-center">
     <div className="inline-flex items-center justify-center w-14 h-14 bg-card rounded-2xl shadow-sm mb-5">
      <Mail className="w-7 h-7 text-primary" />
     </div>
     <h2 className="text-xl font-semibold text-foreground mb-2">
      Vous ne trouvez pas votre réponse ?
     </h2>
     <p className="text-muted-foreground mb-6 max-w-md mx-auto">
      Notre équipe est disponible pour vous aider. Écrivez-nous et nous vous répondrons rapidement.
     </p>
     <a
      href="mailto:contact@kodaflow.com"
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors"
     >
      <Mail className="w-4 h-4" />
      contact@kodaflow.com
     </a>
    </div>
   </main>

   {/* Footer */}
   <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
    <div className="flex justify-center gap-4">
     <Link href="/" className="hover:text-foreground">Accueil</Link>
     <Link href="/docs" className="hover:text-foreground">Documentation</Link>
     <Link href="/legal/confidentialite" className="hover:text-foreground">Confidentialité</Link>
     <Link href="/legal/cgv" className="hover:text-foreground">CGV</Link>
    </div>
   </footer>
  </div>
 )
}
