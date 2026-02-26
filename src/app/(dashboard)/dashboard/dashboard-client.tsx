'use client'

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
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { Plus, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { DateRange } from 'react-day-picker'
import { useDashboardLayout, WidgetId } from '@/hooks/use-dashboard-layout'
import type { KPIs, Activity } from './dashboard-types'
import { getColSpan } from './dashboard-types'
import { SortableWidget } from './sortable-widget'
import {
  RevenueWidget,
  PipelineWidget,
  PendingQuotesWidget,
  UnpaidInvoicesWidget,
  ProjectsWidget,
  RevenueChartWidget,
  QuickActionsWidget,
  ActivityFeedWidget,
} from './dashboard-widgets'
import { CustomizeDialog } from './customize-dialog'

const CalendarDateRangePicker = dynamic(
  () => import('@/components/date-range-picker').then((mod) => mod.CalendarDateRangePicker),
  { ssr: false }
)

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

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'revenue': return <RevenueWidget kpis={kpis} />
      case 'pipeline': return <PipelineWidget kpis={kpis} />
      case 'pendingQuotes': return <PendingQuotesWidget kpis={kpis} />
      case 'unpaidInvoices': return <UnpaidInvoicesWidget kpis={kpis} />
      case 'projects': return <ProjectsWidget kpis={kpis} />
      case 'chart': return <RevenueChartWidget chartData={chartData} />
      case 'quickActions': return <QuickActionsWidget />
      case 'activity': return <ActivityFeedWidget activities={activities} />
      default: return null
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <PageHeader
          title="Dashboard"
          description="Bienvenue sur votre tableau de bord"
          icon={LayoutDashboard}
          actions={
            <>
              <CustomizeDialog
                layout={layout}
                addWidget={addWidget}
                removeWidget={removeWidget}
                resetLayout={resetLayout}
              />
              <CalendarDateRangePicker date={defaultDate} onDateChange={onDateChange} />
              <Link href="/dashboard/quotes">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau devis
                </Button>
              </Link>
            </>
          }
        />
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
