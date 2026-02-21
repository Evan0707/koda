'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  TrendingUp,
  FileText,
  AlertCircle,
  FolderKanban,
  UserPlus,
  FilePlus,
  Clock,
  FileCheck2,
  Receipt,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { KPIs, Activity } from './dashboard-types'
import { formatCurrency, formatCurrencyCompact } from './dashboard-types'

// --- KPI Widgets ---

export function RevenueWidget({ kpis }: { kpis: KPIs | null }) {
  return (
    <Card className="h-full card-premium">
      <CardContent className="pt-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">CA ce mois</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {kpis ? formatCurrency(kpis.revenue.value) : '0 €'}
          </p>
          {kpis && kpis.revenue.change !== 0 && (
            <div className={`flex items-center gap-1 mt-1 text-sm ${kpis.revenue.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {kpis.revenue.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {kpis.revenue.change > 0 ? '+' : ''}{kpis.revenue.change}%
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PipelineWidget({ kpis }: { kpis: KPIs | null }) {
  return (
    <Card className="h-full card-premium">
      <CardContent className="pt-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pipeline</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {kpis ? formatCurrencyCompact(kpis.pipeline.value) : '0 €'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            → {kpis ? formatCurrencyCompact(kpis.pipeline.weighted) : '0 €'} pondéré
          </p>
        </div>
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export function PendingQuotesWidget({ kpis }: { kpis: KPIs | null }) {
  return (
    <Card className="h-full card-premium">
      <CardContent className="pt-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Devis en attente</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {kpis?.pendingQuotes.count || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {kpis ? formatCurrency(kpis.pendingQuotes.value) : '0 €'}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export function UnpaidInvoicesWidget({ kpis }: { kpis: KPIs | null }) {
  return (
    <Card className="h-full card-premium">
      <CardContent className="pt-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Factures impayées</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {kpis?.unpaidInvoices.count || 0}
          </p>
          <p className="text-sm orange-600 dark:text-orange-400 mt-1 font-medium">
            {kpis ? formatCurrency(kpis.unpaidInvoices.value) : '0 €'}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ProjectsWidget({ kpis }: { kpis: KPIs | null }) {
  return (
    <Card className="h-full card-premium">
      <CardContent className="pt-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Projets actifs</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {kpis?.projects.active || 0}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {kpis?.projects.tasks || 0} tâches
          </p>
        </div>
        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <FolderKanban className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
      </CardContent>
    </Card>
  )
}

// --- Chart Widget ---

export function RevenueChartWidget({ chartData }: { chartData: { month: string; revenue: number }[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Chiffre d&apos;affaires (6 mois)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString('fr-FR')} €`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} €`, 'CA']}
                contentStyle={{ borderRadius: '8px' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Quick Actions Widget ---

export function QuickActionsWidget() {
  const actions = [
    { icon: UserPlus, label: "Nouveau contact", href: "/dashboard/contacts" },
    { icon: FilePlus, label: "Créer un devis", href: "/dashboard/quotes" },
    { icon: FolderKanban, label: "Nouveau projet", href: "/dashboard/projects" },
    { icon: Clock, label: "Suivi du temps", href: "/dashboard/time" },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, i) => (
          <Link key={i} href={action.href}>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted mb-1 last:mb-0">
              <action.icon className="w-4 h-4 mr-3" />
              {action.label}
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

// --- Activity Feed Widget ---

export function ActivityFeedWidget({ activities }: { activities: Activity[] }) {
  const typeIcons = { quote: FileCheck2, invoice: Receipt, project: FolderKanban }
  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    accepted: { label: 'Accepté', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    paid: { label: 'Payé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    overdue: { label: 'En retard', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    active: { label: 'Actif', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    completed: { label: 'Terminé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Aucune activité</p>
          </div>
        ) : (
          <div className="space-y-3 animate-stagger">
            {activities.map((activity) => {
              const Icon = typeIcons[activity.type]
              const status = activity.status ? statusLabels[activity.status] : null
              return (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {status && (
                    <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
