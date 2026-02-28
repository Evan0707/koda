import { Metadata } from 'next'
import Link from 'next/link'
import { ThemeLogo } from '@/components/theme-logo'
import {
 Sparkles,
 Bug,
 Zap,
 Shield,
 ArrowRight,
 Tag,
} from 'lucide-react'

export const metadata: Metadata = {
 title: 'Changelog | KodaFlow',
 description: 'Historique des mises à jour, nouvelles fonctionnalités et corrections de KodaFlow.',
}

type ChangeType = 'feature' | 'improvement' | 'fix' | 'security'

interface Change {
 type: ChangeType
 text: string
}

interface Release {
 version: string
 date: string
 title: string
 changes: Change[]
}

const typeConfig: Record<ChangeType, { label: string; icon: typeof Sparkles; color: string }> = {
 feature: { label: 'Nouveauté', icon: Sparkles, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
 improvement: { label: 'Amélioration', icon: Zap, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
 fix: { label: 'Correction', icon: Bug, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
 security: { label: 'Sécurité', icon: Shield, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
}

const releases: Release[] = [
 {
  version: '1.4.0',
  date: '28 février 2026',
  title: 'Documentation & Pages légales',
  changes: [
   { type: 'feature', text: 'Système de documentation complet avec 7 guides thématiques.' },
   { type: 'feature', text: 'Centre d\'aide public avec FAQ interactive et recherche.' },
   { type: 'feature', text: 'Pages légales complètes : CGV, Politique de confidentialité, Mentions légales.' },
   { type: 'feature', text: 'Changelog public pour le suivi des nouveautés.' },
   { type: 'improvement', text: 'Mise en place de tests E2E automatisés (Playwright) sur les flux critiques.' },
   { type: 'improvement', text: 'Logo adaptatif light/dark sur toute l\'application.' },
   { type: 'improvement', text: 'Favicon dynamique selon le thème du navigateur.' },
   { type: 'improvement', text: 'Page 404 personnalisée avec liens utiles.' },
   { type: 'fix', text: 'Correction des erreurs d\'hydratation sur les dates des pages légales.' },
  ],
 },
 {
  version: '1.3.0',
  date: '27 février 2026',
  title: 'Co-pilote IA Business',
  changes: [
   { type: 'feature', text: 'Widget Co-pilote IA avec insights business en temps réel.' },
   { type: 'feature', text: 'Analyse automatique de votre activité (CA, clients, tendances).' },
   { type: 'improvement', text: 'Génération IA des devis améliorée.' },
  ],
 },
 {
  version: '1.2.0',
  date: '26 février 2026',
  title: 'Améliorations UX & Accessibilité',
  changes: [
   { type: 'improvement', text: 'Audit SEO et amélioration de l\'accessibilité de toutes les pages.' },
   { type: 'improvement', text: 'Navigation clavier optimisée sur les formulaires.' },
   { type: 'improvement', text: 'Balises meta enrichies pour un meilleur référencement.' },
   { type: 'fix', text: 'Corrections de contraste sur les textes en mode sombre.' },
  ],
 },
 {
  version: '1.1.0',
  date: '25 février 2026',
  title: 'Gestion avancée & Corrections',
  changes: [
   { type: 'feature', text: 'Suppression de devis et factures avec archivage 30 jours.' },
   { type: 'feature', text: 'Redirection automatique vers le devis après création.' },
   { type: 'feature', text: 'Popup upgrade plan pour la génération IA sur le plan gratuit.' },
   { type: 'improvement', text: 'Gestion des erreurs et états de chargement améliorée.' },
   { type: 'improvement', text: 'Remplacement des selects natifs par des composants enrichis.' },
   { type: 'fix', text: 'Informations d\'entreprise corrigées sur les devis.' },
  ],
 },
 {
  version: '1.0.0',
  date: '11 février 2026',
  title: 'Lancement de KodaFlow',
  changes: [
   { type: 'feature', text: 'CRM complet : contacts, entreprises, pipeline commercial.' },
   { type: 'feature', text: 'Création et envoi de devis avec signature électronique.' },
   { type: 'feature', text: 'Facturation avec paiement en ligne via Stripe.' },
   { type: 'feature', text: 'Gestion de projets, suivi du temps et des dépenses.' },
   { type: 'feature', text: 'Génération IA de devis et d\'emails.' },
   { type: 'feature', text: 'Export comptable CSV et FEC.' },
   { type: 'feature', text: 'Intégrations Gmail et Stripe.' },
   { type: 'feature', text: 'Plans Gratuit, Starter (19€/mois) et Pro (49€/mois).' },
  ],
 },
]

export default function ChangelogPage() {
 return (
  <div className="min-h-screen bg-background">
   {/* Header */}
   <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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

   <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
    {/* Hero */}
    <div className="text-center mb-14">
     <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5">
      <Tag className="w-3.5 h-3.5" />
      v{releases[0].version}
     </div>
     <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
      Changelog
     </h1>
     <p className="text-lg text-muted-foreground max-w-xl mx-auto">
      Toutes les mises à jour, nouvelles fonctionnalités et corrections apportées à KodaFlow.
     </p>
    </div>

    {/* Timeline */}
    <div className="relative">
     {/* Timeline line */}
     <div className="absolute left-[19px] top-8 bottom-8 w-px bg-border hidden sm:block" />

     <div className="space-y-12">
      {releases.map((release, ri) => (
       <div key={ri} className="relative">
        {/* Timeline dot */}
        <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center hidden sm:flex z-10">
         <span className="text-xs font-bold text-primary">{release.version.split('.')[1]}</span>
        </div>

        <div className="sm:ml-16">
         {/* Release header */}
         <div className="flex flex-wrap items-baseline gap-3 mb-4">
          <h2 className="text-xl font-bold text-foreground">{release.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span className="px-2 py-0.5 rounded-md bg-muted font-mono text-xs">v{release.version}</span>
           <span>·</span>
           <span>{release.date}</span>
          </div>
         </div>

         {/* Changes */}
         <div className="space-y-2">
          {release.changes.map((change, ci) => {
           const config = typeConfig[change.type]
           const Icon = config.icon
           return (
            <div key={ci} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 mt-0.5 ${config.color}`}>
              <Icon className="w-3 h-3" />
              {config.label}
             </span>
             <p className="text-sm text-foreground leading-relaxed">{change.text}</p>
            </div>
           )
          })}
         </div>
        </div>
       </div>
      ))}
     </div>
    </div>
   </main>

   {/* Footer */}
   <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
    <div className="flex justify-center gap-4">
     <Link href="/" className="hover:text-foreground">Accueil</Link>
     <Link href="/docs" className="hover:text-foreground">Documentation</Link>
     <Link href="/aide" className="hover:text-foreground">Centre d'aide</Link>
    </div>
   </footer>
  </div>
 )
}
