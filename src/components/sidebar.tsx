'use client'

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
} from 'lucide-react'
import { NavItem } from './nav-item'
import Image from 'next/image'
import logo from '../../assets/logo.png'

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
  ]
 },
]

export function Sidebar() {
 return (
  <aside className="fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border shadow-sm hidden lg:block">
   {/* Logo */}
   <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
    <Link href="/dashboard" className="flex items-center gap-2">
     <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
      <Image src={logo} alt="Logo" className='w-full h-full object-contain rounded-lg' />
     </div>
     <span className="text-lg font-semibold text-sidebar-foreground">KodaFlow</span>
    </Link>
   </div>

   {/* Main Navigation with Sections */}
   <nav id="sidebar-nav" className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
    {navSections.map((section, idx) => (
     <div key={idx}>
      {section.title && (
       <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {section.title}
       </p>
      )}
      <div className="space-y-1">
       {section.items.map((item) => (
        <NavItem key={item.href} {...item} />
       ))}
      </div>
     </div>
    ))}
   </nav>
  </aside>
 )
}
