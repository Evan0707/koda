'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  TrendingUp,
  FileText,
  AlertCircle,
  FolderKanban,
  Plus,
  UserPlus,
  FilePlus,
  Clock,
  FileCheck2,
  Receipt,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  GripVertical,
  Layout,
  RotateCcw,
  Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DateRange } from 'react-day-picker'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useDashboardLayout, WidgetId } from '@/hooks/use-dashboard-layout'
import { cn } from '@/lib/utils'

// Types
type KPIs = {
  revenue: { value: number; change: number; trend: string }
  pendingQuotes: { count: number; value: number }
  unpaidInvoices: { count: number; value: number }
  projects: { active: number; projects: number; tasks: number }
  pipeline: { count: number; value: number; weighted: number }
}

type Activity = {
  type: 'quote' | 'invoice' | 'project'
  id: string
  title: string
  status: string | null
  createdAt: Date
  href: string
}

const CalendarDateRangePicker = dynamic(
  () => import('@/components/date-range-picker').then((mod) => mod.CalendarDateRangePicker),
  { ssr: false }
)

// Formatters
const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(cents / 100)

const formatCurrencyCompact = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(cents / 100)

const WIDGET_CONFIG: Record<string, string> = {
  revenue: 'Chiffre d\'affaires',
  pipeline: 'Pipeline commercial',
  pendingQuotes: 'Devis en attente',
  unpaidInvoices: 'Factures impayées',
  projects: 'Projets actifs',
  chart: 'Graphique CA',
  quickActions: 'Actions rapides',
  activity: 'Activité récente',
}

// --- Widgets Components ---

function SortableWidget({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative h-full group", className)}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border border-border cursor-grab active:cursor-grabbing hover:bg-accent transition-all opacity-0 group-hover:opacity-100"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={cn("h-full transition-all duration-200", isDragging && "ring-2 ring-primary/20 rounded-xl scale-[0.99]")}>
        {children}
      </div>
    </div>
  )
}

export default function DashboardClient({
  kpis,
  chartData,
  activities,
  defaultDate
}: {
  kpis: KPIs | null
  chartData: { month: string; revenue: number }[]
  activities: Activity[]
  defaultDate?: { from: Date; to: Date }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { layout, saveLayout, resetLayout, addWidget, removeWidget, isLoaded } = useDashboardLayout()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = layout.indexOf(active.id as WidgetId)
      const newIndex = layout.indexOf(over.id as WidgetId)
      saveLayout(arrayMove(layout, oldIndex, newIndex))
    }
  }

  const onDateChange = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (range?.from) params.set('from', range.from.toISOString())
    else params.delete('from')
    if (range?.to) params.set('to', range.to.toISOString())
    else params.delete('to')
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Widget Renderers
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'revenue':
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
      case 'pipeline':
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
      case 'pendingQuotes':
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
      case 'unpaidInvoices':
        return (
          <Card className="h-full card-premium">
            <CardContent className="pt-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Factures impayées</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {kpis?.unpaidInvoices.count || 0}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  {kpis ? formatCurrency(kpis.unpaidInvoices.value) : '0 €'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        )
      case 'projects':
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
      case 'chart':
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Chiffre d'affaires (6 mois)</CardTitle>
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
      case 'quickActions':
        return (
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: UserPlus, label: "Nouveau contact", href: "/dashboard/contacts" },
                { icon: FilePlus, label: "Créer un devis", href: "/dashboard/quotes" },
                { icon: FolderKanban, label: "Nouveau projet", href: "/dashboard/projects" },
                { icon: Clock, label: "Suivi du temps", href: "/dashboard/time" },
              ].map((action, i) => (
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
      case 'activity':
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
                    const typeIcons = { quote: FileCheck2, invoice: Receipt, project: FolderKanban }
                    const Icon = typeIcons[activity.type]
                    const statusLabels: any = {
                      draft: { label: 'Brouillon', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
                      sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                      accepted: { label: 'Accepté', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                      paid: { label: 'Payé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                      overdue: { label: 'En retard', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
                      active: { label: 'Actif', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
                      completed: { label: 'Terminé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
                    }
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
      default:
        return null
    }
  }

  // Widget Grid Spans
  const getColSpan = (id: WidgetId) => {
    switch (id) {
      case 'chart': return 'col-span-1 lg:col-span-2'
      default: return 'col-span-1'
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur votre tableau de bord
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <Layout className="w-3 h-3" />
                Personnaliser
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Personnaliser le tableau de bord</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {Object.entries(WIDGET_CONFIG).map(([id, label]) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`widget-${id}`}
                          checked={layout.includes(id as WidgetId)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addWidget(id as WidgetId)
                            } else {
                              removeWidget(id as WidgetId)
                            }
                          }}
                        />
                        <Label htmlFor={`widget-${id}`} className="cursor-pointer font-normal">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={resetLayout} className="text-muted-foreground h-8 text-xs">
                  <RotateCcw className="w-3 h-3 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" onClick={resetLayout} className="hidden h-8 text-xs mr-2 text-muted-foreground hover:text-foreground">
            <RotateCcw className="w-3 h-3 mr-1" />
            Réinitialiser
          </Button>

          <CalendarDateRangePicker date={defaultDate} onDateChange={onDateChange} />
          <Link href="/dashboard/quotes">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau devis
            </Button>
          </Link>
        </div>
      </div>

      {/* Drag & Drop Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <SortableContext
            items={layout}
            strategy={rectSortingStrategy}
          >
            {isLoaded && layout.map((id) => (
              <SortableWidget
                key={id}
                id={id}
                className={getColSpan(id)}
              >
                {renderWidget(id)}
              </SortableWidget>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  )
}
