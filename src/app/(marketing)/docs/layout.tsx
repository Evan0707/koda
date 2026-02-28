'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
 Rocket,
 Users,
 FileText,
 Receipt,
 FolderKanban,
 CreditCard,
 Settings,
 ChevronRight,
 Menu,
 X,
 ArrowLeft,
 Search,
} from 'lucide-react'
import { ThemeLogo } from '@/components/theme-logo'

const docCategories = [
 { slug: 'demarrage', label: 'Démarrage', icon: Rocket, description: 'Premiers pas avec KodaFlow' },
 { slug: 'contacts', label: 'Contacts & CRM', icon: Users, description: 'Gérer vos contacts et pipeline' },
 { slug: 'devis', label: 'Devis', icon: FileText, description: 'Créer et envoyer des devis' },
 { slug: 'factures', label: 'Factures', icon: Receipt, description: 'Facturation et paiements' },
 { slug: 'projets', label: 'Projets', icon: FolderKanban, description: 'Suivi de projets et temps' },
 { slug: 'abonnement', label: 'Abonnement', icon: CreditCard, description: 'Plans et facturation' },
 { slug: 'parametres', label: 'Paramètres', icon: Settings, description: 'Configuration du compte' },
]

export { docCategories }

export default function DocsLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname()
 const [sidebarOpen, setSidebarOpen] = useState(false)

 const currentCategory = docCategories.find(c => pathname === `/docs/${c.slug}`)

 return (
  <div className="min-h-screen bg-background">
   {/* Header */}
   <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
     <div className="flex items-center gap-4">
      <button
       onClick={() => setSidebarOpen(true)}
       className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
       aria-label="Menu"
      >
       <Menu className="w-5 h-5" />
      </button>
      <Link href="/" className="flex items-center gap-2">
       <ThemeLogo className="w-7 h-7" />
       <span className="font-semibold text-foreground">KodaFlow</span>
      </Link>
      <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
      <Link href="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block">
       Documentation
      </Link>
      {currentCategory && (
       <>
        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <span className="text-sm font-medium text-foreground hidden sm:block">{currentCategory.label}</span>
       </>
      )}
     </div>
     <Link href="/signup">
      <button className="text-sm font-medium px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors">
       Démarrer
      </button>
     </Link>
    </div>
   </header>

   <div className="max-w-7xl mx-auto flex">
    {/* Desktop Sidebar */}
    <aside className="hidden lg:block w-64 shrink-0 border-r border-border sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
     <nav className="p-4 space-y-1">
      <Link
       href="/docs"
       className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/docs' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
       <Search className="w-4 h-4" />
       Vue d'ensemble
      </Link>
      <div className="pt-2">
       {docCategories.map((cat) => {
        const Icon = cat.icon
        const isActive = pathname === `/docs/${cat.slug}`
        return (
         <Link
          key={cat.slug}
          href={`/docs/${cat.slug}`}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
           }`}
         >
          <Icon className="w-4 h-4 shrink-0" />
          {cat.label}
         </Link>
        )
       })}
      </div>
     </nav>
    </aside>

    {/* Mobile Sidebar Overlay */}
    {sidebarOpen && (
     <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      <aside className="fixed inset-y-0 left-0 w-72 bg-background z-50 lg:hidden shadow-xl overflow-y-auto">
       <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <span className="font-semibold">Documentation</span>
        <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-muted">
         <X className="w-5 h-5" />
        </button>
       </div>
       <nav className="p-4 space-y-1">
        <Link
         href="/docs"
         onClick={() => setSidebarOpen(false)}
         className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === '/docs' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
         Vue d'ensemble
        </Link>
        {docCategories.map((cat) => {
         const Icon = cat.icon
         const isActive = pathname === `/docs/${cat.slug}`
         return (
          <Link
           key={cat.slug}
           href={`/docs/${cat.slug}`}
           onClick={() => setSidebarOpen(false)}
           className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
           <Icon className="w-4 h-4 shrink-0" />
           {cat.label}
          </Link>
         )
        })}
       </nav>
      </aside>
     </>
    )}

    {/* Main Content */}
    <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 sm:py-12">
     {children}
    </main>
   </div>

   {/* Footer */}
   <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
    <p>© 2026 KodaFlow. Tous droits réservés.</p>
    <div className="flex justify-center gap-4 mt-2">
     <Link href="/" className="hover:text-foreground">Accueil</Link>
     <Link href="/legal/confidentialite" className="hover:text-foreground">Confidentialité</Link>
     <Link href="/legal/cgv" className="hover:text-foreground">CGV</Link>
    </div>
   </footer>
  </div>
 )
}
