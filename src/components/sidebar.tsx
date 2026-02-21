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
 Wallet,
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
   { href: '/dashboard/expenses', icon: Wallet, label: 'Dépenses' },
  ]
 },
]

import { PlanBadge } from './plan-badge'
import { PLAN_LIMITS } from '@/lib/utils/plan-limits'

type SubscriptionStatus = {
 plan: 'free' | 'starter' | 'pro'
 planStatus: string | null
 stripeSubscriptionId: string | null
 commissionRate: string | null
 monthlyInvoiceCount: number | null
 cancelAtPeriodEnd?: boolean
 subscriptionEndDate?: Date | null
}

export function Sidebar({
 subscriptionStatus,
 role = 'member'
}: {
 subscriptionStatus?: SubscriptionStatus
 role?: 'owner' | 'admin' | 'member'
}) {
 return (
  <aside className="fixed inset-y-0 left-0 w-60 bg-sidebar border-r border-sidebar-border shadow-sm hidden lg:flex flex-col">
   {/* Logo */}
   <div className="h-16 flex items-center px-5 border-b border-sidebar-border shrink-0">
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

   {/* Plan Badge Footer */}
   {subscriptionStatus && (
    <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
     <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Mon Plan</span>
      <PlanBadge plan={subscriptionStatus.plan} />
     </div>
     {/* Free Plan */}
     {subscriptionStatus.plan === 'free' && (
      <div className="text-xs text-muted-foreground">
       <p className="mb-2">{subscriptionStatus.monthlyInvoiceCount ?? 0} / {PLAN_LIMITS.free.maxInvoicesPerMonth} factures ce mois</p>
       <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div
         className="h-full bg-primary"
         style={{ width: `${Math.min(((subscriptionStatus.monthlyInvoiceCount ?? 0) / PLAN_LIMITS.free.maxInvoicesPerMonth) * 100, 100)}%` }}
        />
       </div>
       <Link href="/dashboard/upgrade" className="text-primary hover:underline">
        Passer à Premium &rarr;
       </Link>
      </div>
     )}

     {/* Starter Plan */}
     {subscriptionStatus.plan === 'starter' && (
      <div className="text-xs text-muted-foreground">
       <p className="mb-2">{subscriptionStatus.monthlyInvoiceCount ?? 0} / {PLAN_LIMITS.starter.maxInvoicesPerMonth} factures ce mois</p>
       <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-2">
        <div
         className="h-full bg-blue-500"
         style={{ width: `${Math.min(((subscriptionStatus.monthlyInvoiceCount ?? 0) / PLAN_LIMITS.starter.maxInvoicesPerMonth) * 100, 100)}%` }}
        />
       </div>
       <Link href="/dashboard/upgrade" className="text-primary hover:underline">
        Passer à Pro &rarr;
       </Link>
      </div>
     )}

     {/* Pro Plan */}
     {subscriptionStatus.plan === 'pro' && (
      <div className="text-xs text-muted-foreground">
       <p className="mb-2">Factures illimitées</p>
       <p className="mb-2 text-[10px] opacity-70">({subscriptionStatus.monthlyInvoiceCount ?? 0} factures ce mois)</p>
       <Link href="/dashboard/settings?tab=billing" className="text-primary hover:underline">
        Gérer mon abonnement &rarr;
       </Link>
      </div>
     )}
    </div>
   )}
  </aside>
 )
}
