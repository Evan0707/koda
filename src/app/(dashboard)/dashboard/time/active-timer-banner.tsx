'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Timer, Square } from 'lucide-react'
import { TimeEntryWithRelations } from '@/lib/actions/time-entries'
import { formatTimer } from './time-utils'

export function ActiveTimerBanner({
  timer,
  timerSeconds,
  isPending,
  onStop,
}: {
  timer: TimeEntryWithRelations
  timerSeconds: number
  isPending: boolean
  onStop: () => void
}) {
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
              <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">Timer en cours</p>
              <p className="text-sm text-muted-foreground">
                {timer.project?.name}
                {timer.description && ` - ${timer.description}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl font-bold text-green-600 dark:text-green-400">
              {formatTimer(timerSeconds)}
            </span>
            <Button
              onClick={onStop}
              disabled={isPending}
              variant="destructive"
              size="lg"
            >
              <Square className="w-5 h-5 mr-2" />
              Arrêter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
