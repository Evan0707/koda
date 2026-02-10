'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
 title: string
 description?: string
 icon?: LucideIcon
 actions?: ReactNode
}

/**
 * Standardized page header component for consistency across all dashboard pages.
 * 
 * @example
 * <PageHeader
 *   title="Devis"
 *   description="Gérez vos propositions commerciales"
 *   icon={FileText}
 *   actions={
 *     <Button>Nouveau devis</Button>
 *   }
 * />
 */
export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
 return (
  <div className="flex items-center justify-between flex-wrap gap-4">
   <div className="flex items-center gap-3">
    {Icon && (
     <div className="p-2 bg-primary/10 rounded-lg">
      <Icon className="w-6 h-6 text-primary" />
     </div>
    )}
    <div>
     <h1 className="text-2xl font-bold text-foreground">{title}</h1>
     {description && (
      <p className="text-muted-foreground">{description}</p>
     )}
    </div>
   </div>
   {actions && (
    <div className="flex items-center gap-2 flex-wrap">
     {actions}
    </div>
   )}
  </div>
 )
}
