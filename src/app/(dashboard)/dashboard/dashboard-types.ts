import type { WidgetId } from '@/hooks/use-dashboard-layout'

export type KPIs = {
  revenue: { value: number; change: number; trend: string }
  pendingQuotes: { count: number; value: number }
  unpaidInvoices: { count: number; value: number }
  projects: { active: number; projects: number; tasks: number }
  pipeline: { count: number; value: number; weighted: number }
}

export type Activity = {
  type: 'quote' | 'invoice' | 'project'
  id: string
  title: string
  status: string | null
  createdAt: Date
  href: string
}

export const WIDGET_CONFIG: Record<string, string> = {
  revenue: 'Chiffre d\'affaires',
  pipeline: 'Pipeline commercial',
  pendingQuotes: 'Devis en attente',
  unpaidInvoices: 'Factures impayées',
  projects: 'Projets actifs',
  chart: 'Graphique CA',
  copilot: 'Co-pilote IA',
  quickActions: 'Actions rapides',
  activity: 'Activité récente',
}

export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)

export const formatCurrencyCompact = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(cents / 100)

export const getColSpan = (id: WidgetId) => {
  switch (id) {
    case 'chart': return 'col-span-1 lg:col-span-2'
    case 'copilot': return 'col-span-1 lg:col-span-2'
    default: return 'col-span-1'
  }
}
