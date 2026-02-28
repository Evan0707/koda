import { useState, useEffect } from 'react'

export type WidgetId =
 | 'revenue'
 | 'pipeline'
 | 'pendingQuotes'
 | 'unpaidInvoices'
 | 'projects'
 | 'chart'
 | 'quickActions'
 | 'activity'
 | 'copilot'

const DEFAULT_LAYOUT: WidgetId[] = [
 'revenue',
 'pipeline',
 'pendingQuotes',
 'unpaidInvoices',
 'projects',
 'chart',
 'copilot',
 'quickActions',
 'activity',
]

export function useDashboardLayout() {
 const [layout, setLayout] = useState<WidgetId[]>(DEFAULT_LAYOUT)
 const [isLoaded, setIsLoaded] = useState(false)

 useEffect(() => {
  const saved = localStorage.getItem('dashboard-layout')
  if (saved) {
   try {
    const parsed = JSON.parse(saved)
    // Filter out invalid IDs but DO NOT force all default widgets to be present
    // This allows users to hide widgets
    const clean = parsed.filter((id: any) => DEFAULT_LAYOUT.includes(id))

    // Only use default if the clean layout is empty (edge case) or if it's a first load
    if (clean.length > 0) {
     setLayout(clean)
    } else {
     // If saved layout resulted in empty (e.g. all widgets invalid), revert to default
     setLayout(DEFAULT_LAYOUT)
    }
   } catch (e) {
    console.error('Failed to parse dashboard layout', e)
   }
  }
  setIsLoaded(true)
 }, [])

 const saveLayout = (newLayout: WidgetId[]) => {
  setLayout(newLayout)
  localStorage.setItem('dashboard-layout', JSON.stringify(newLayout))
 }

 const addWidget = (id: WidgetId) => {
  if (layout.includes(id)) return
  const newLayout = [...layout, id]
  saveLayout(newLayout)
 }

 const removeWidget = (id: WidgetId) => {
  const newLayout = layout.filter(w => w !== id)
  saveLayout(newLayout)
 }

 const resetLayout = () => {
  setLayout(DEFAULT_LAYOUT)
  localStorage.setItem('dashboard-layout', JSON.stringify(DEFAULT_LAYOUT))
 }

 return { layout, saveLayout, addWidget, removeWidget, resetLayout, isLoaded }
}
