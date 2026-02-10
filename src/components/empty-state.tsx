'use client'

import { ReactNode } from 'react'
import { LucideIcon, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
 icon?: LucideIcon
 title: string
 description: string
 action?: {
  label: string
  href?: string
  onClick?: () => void
 }
 secondaryAction?: {
  label: string
  onClick: () => void
 }
}

/**
 * Standardized empty state component for consistency across all dashboard pages.
 * 
 * @example
 * <EmptyState
 *   icon={FileText}
 *   title="Aucun devis"
 *   description="Créez votre premier devis pour commencer."
 *   action={{ label: "Créer un devis", href: "/dashboard/quotes/create" }}
 * />
 */
export function EmptyState({
 icon: Icon = FolderOpen,
 title,
 description,
 action,
 secondaryAction
}: EmptyStateProps) {
 return (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
   <div className="p-4 bg-muted/30 rounded-full mb-4">
    <Icon className="w-12 h-12 text-muted-foreground/50" />
   </div>
   <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
   <p className="mb-4 max-w-sm">{description}</p>
   <div className="flex gap-2">
    {action && (
     action.href ? (
      <a href={action.href}>
       <Button>{action.label}</Button>
      </a>
     ) : (
      <Button onClick={action.onClick}>{action.label}</Button>
     )
    )}
    {secondaryAction && (
     <Button variant="outline" onClick={secondaryAction.onClick}>
      {secondaryAction.label}
     </Button>
    )}
   </div>
  </div>
 )
}
