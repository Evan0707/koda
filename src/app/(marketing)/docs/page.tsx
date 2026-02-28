import { Metadata } from 'next'
import Link from 'next/link'
import {
 Rocket,
 Users,
 FileText,
 Receipt,
 FolderKanban,
 CreditCard,
 Settings,
 ArrowRight,
 Search,
} from 'lucide-react'

export const metadata: Metadata = {
 title: 'Documentation | KodaFlow',
 description: 'Guide complet pour utiliser KodaFlow : CRM, devis, factures, projets et plus encore.',
}

const categories = [
 {
  slug: 'demarrage',
  label: 'Démarrage',
  icon: Rocket,
  description: 'Créer votre compte, configurer votre entreprise et envoyer votre premier devis.',
  color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
 },
 {
  slug: 'contacts',
  label: 'Contacts & CRM',
  icon: Users,
  description: 'Gérer vos contacts, entreprises, tags, import CSV et pipeline commercial.',
  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
 },
 {
  slug: 'devis',
  label: 'Devis',
  icon: FileText,
  description: 'Créer des devis, les envoyer, les faire signer et les convertir en factures.',
  color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
 },
 {
  slug: 'factures',
  label: 'Factures',
  icon: Receipt,
  description: 'Facturation, paiement en ligne Stripe, export comptable et fichier FEC.',
  color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
 },
 {
  slug: 'projets',
  label: 'Projets',
  icon: FolderKanban,
  description: 'Suivi de projets, gestion des tâches, pointage du temps et dépenses.',
  color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
 },
 {
  slug: 'abonnement',
  label: 'Abonnement',
  icon: CreditCard,
  description: 'Plans Gratuit, Starter et Pro, essai gratuit, changer ou annuler votre plan.',
  color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
 },
 {
  slug: 'parametres',
  label: 'Paramètres',
  icon: Settings,
  description: 'Profil, organisation, intégrations (Gmail, Stripe), membres et sécurité.',
  color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
 },
]

export default function DocsPage() {
 return (
  <div className="max-w-4xl mx-auto">
   {/* Hero */}
   <div className="text-center mb-12">
    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
     Documentation KodaFlow
    </h1>
    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
     Tout ce que vous devez savoir pour tirer le meilleur de KodaFlow.
     Guides pas-à-pas, astuces et bonnes pratiques.
    </p>
   </div>

   {/* Categories Grid */}
   <div className="grid sm:grid-cols-2 gap-4">
    {categories.map((cat) => {
     const Icon = cat.icon
     return (
      <Link
       key={cat.slug}
       href={`/docs/${cat.slug}`}
       className="group flex items-start gap-4 p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-card"
      >
       <div className={`p-2.5 rounded-lg shrink-0 ${cat.color}`}>
        <Icon className="w-5 h-5" />
       </div>
       <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
         {cat.label}
         <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </h2>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
         {cat.description}
        </p>
       </div>
      </Link>
     )
    })}
   </div>

   {/* Contact CTA */}
   <div className="mt-12 text-center space-y-2">
    <p className="text-muted-foreground">
     Vous ne trouvez pas ce que vous cherchez ?
    </p>
    <a href="mailto:contact@kodaflow.com" className="text-primary hover:underline font-medium">
     Contactez-nous →
    </a>
   </div>
  </div>
 )
}
