'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
 LayoutDashboard,
 Users,
 Target,
 FileText,
 Receipt,
 FolderKanban,
 Clock,
 FileSignature,
 Package,
 Wallet,
 Menu,
 X,
} from 'lucide-react'
import { NavItem } from './nav-item'
import { ThemeLogo } from './theme-logo'

const navSections = [
 {
  title: null,
  items: [
   { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]
 },
 {
  title: 'CRM',
  items: [
   { href: '/dashboard/contacts', icon: Users, label: 'Contacts' },
   { href: '/dashboard/pipeline', icon: Target, label: 'Pipeline' },
  ]
 },
 {
  title: 'Commercial',
  items: [
   { href: '/dashboard/quotes', icon: FileText, label: 'Devis' },
   { href: '/dashboard/invoices', icon: Receipt, label: 'Factures' },
   { href: '/dashboard/contracts', icon: FileSignature, label: 'Contrats' },
  ]
 },
 {
  title: 'Gestion',
  items: [
   { href: '/dashboard/projects', icon: FolderKanban, label: 'Projets' },
   { href: '/dashboard/products', icon: Package, label: 'Produits' },
   { href: '/dashboard/time', icon: Clock, label: 'Temps' },
   { href: '/dashboard/expenses', icon: Wallet, label: 'Dépenses' },
  ]
 },
]

export function MobileNav() {
 const [isOpen, setIsOpen] = useState(false)

 return (
  <>
   {/* Mobile menu button */}
   <button
    onClick={() => setIsOpen(true)}
    className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
    aria-label="Open menu"
   >
    <Menu className="w-6 h-6 text-muted-foreground" />
   </button>

   {/* Mobile sidebar overlay */}
   {isOpen && (
    <>
     {/* Backdrop */}
     <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-fade-in"
      onClick={() => setIsOpen(false)}
     />

     {/* Sidebar */}
     <aside className="fixed inset-y-0 left-0 w-72 bg-sidebar z-50 lg:hidden shadow-xl animate-slide-in-right">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
       <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
        <div className="w-8 h-8 flex items-center justify-center">
         <ThemeLogo className="w-8 h-8" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">KodaFlow</span>
       </Link>
       <button
        onClick={() => setIsOpen(false)}
        className="p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
        aria-label="Close menu"
       >
        <X className="w-5 h-5 text-sidebar-foreground/70" />
       </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
       {navSections.map((section, idx) => (
        <div key={idx}>
         {section.title && (
          <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
           {section.title}
          </p>
         )}
         <div className="space-y-1">
          {section.items.map((item) => (
           <div key={item.href} onClick={() => setIsOpen(false)}>
            <NavItem {...item} />
           </div>
          ))}
         </div>
        </div>
       ))}
      </nav>
     </aside>
    </>
   )}
  </>
 )
}
