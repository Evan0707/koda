'use client'

import { Button } from '@/components/ui/button'
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
import { Layout, RotateCcw } from 'lucide-react'
import { WidgetId } from '@/hooks/use-dashboard-layout'
import { WIDGET_CONFIG } from './dashboard-types'

export function CustomizeDialog({
  layout,
  addWidget,
  removeWidget,
  resetLayout,
}: {
  layout: WidgetId[]
  addWidget: (id: WidgetId) => void
  removeWidget: (id: WidgetId) => void
  resetLayout: () => void
}) {
  return (
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
  )
}
