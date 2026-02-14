import { cn } from '@/lib/utils'

export type StatusVariant = 'muted' | 'blue' | 'green' | 'red' | 'orange' | 'yellow' | 'purple'

const variantStyles: Record<StatusVariant, string> = {
 muted: 'bg-muted text-muted-foreground',
 blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
 green: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
 red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
 orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
 yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
 purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
}

export interface StatusConfig {
 label: string
 variant: StatusVariant
}

interface StatusBadgeProps {
 status: string
 statusConfig: Record<string, StatusConfig>
 className?: string
}

/**
 * Reusable status badge component.
 *
 * @example
 * const QUOTE_STATUSES: Record<string, StatusConfig> = {
 *   draft: { label: 'Brouillon', variant: 'muted' },
 *   sent: { label: 'Envoyé', variant: 'blue' },
 *   accepted: { label: 'Accepté', variant: 'green' },
 * }
 * <StatusBadge status={quote.status} statusConfig={QUOTE_STATUSES} />
 */
export function StatusBadge({ status, statusConfig, className }: StatusBadgeProps) {
 const config = statusConfig[status] || { label: status, variant: 'muted' as StatusVariant }

 return (
  <span
   className={cn(
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    variantStyles[config.variant],
    className
   )}
  >
   {config.label}
  </span>
 )
}
