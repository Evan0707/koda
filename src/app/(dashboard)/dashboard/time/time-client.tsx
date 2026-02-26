'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Clock,
  Square,
  Trash2,
  FolderKanban,
  Download,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import {
  createTimeEntry,
  deleteTimeEntry,
  startTimer,
  stopTimer,
  getTimeEntries,
  TimeEntryFormData,
  TimeEntryWithRelations,
} from '@/lib/actions/time-entries'
import { createInvoiceFromTime } from '@/lib/actions/invoices'
import { Project } from '@/types/db'
import { useConfirm } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { useRouter } from 'next/navigation'
import { formatDuration, formatDurationShort, formatTimer, formatDateLabel } from './time-utils'
import { TimerStartDialog, ManualEntryDialog, TimeInvoiceDialog } from './time-dialogs'
import { ActiveTimerBanner } from './active-timer-banner'

export default function TimeTrackingClient({
  initialEntries,
  summary,
  activeTimer,
  projects,
}: {
  initialEntries: TimeEntryWithRelations[]
  summary: { today: number; week: number }
  activeTimer: TimeEntryWithRelations | null
  projects: (Project & { company: { name: string } | null })[]
}) {
  const [entries, setEntries] = useState<TimeEntryWithRelations[]>(initialEntries)
  const [timer, setTimer] = useState<TimeEntryWithRelations | null>(activeTimer)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false)
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { confirm } = useConfirm()
  const router = useRouter()

  // Timer tick
  useEffect(() => {
    if (!timer || !timer.startedAt) return
    const startTime = new Date(timer.startedAt).getTime()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setTimerSeconds(elapsed)
    }, 1000)
    return () => clearInterval(interval)
  }, [timer])

  const handleStartTimer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await startTimer(
        formData.get('projectId') as string,
        formData.get('taskId') as string || undefined,
        formData.get('description') as string || undefined
      )
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Timer démarré')
        setTimer(result.entry as TimeEntryWithRelations)
        setTimerSeconds(0)
        setIsTimerDialogOpen(false)
      }
    })
  }

  const handleStopTimer = async () => {
    if (!timer) return
    startTransition(async () => {
      const result = await stopTimer(timer.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Timer arrêté')
        setTimer(null)
        setTimerSeconds(0)
        const res = await getTimeEntries()
        if (res.entries) setEntries(res.entries)
      }
    })
  }

  const handleCreateEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const hours = Number(formData.get('hours') || 0)
    const minutes = Number(formData.get('minutes') || 0)
    const duration = hours * 60 + minutes
    const data: TimeEntryFormData = {
      projectId: formData.get('projectId') as string,
      description: formData.get('description') as string || undefined,
      duration,
      date: formData.get('date') as string,
      isBillable: true,
    }
    startTransition(async () => {
      const result = await createTimeEntry(data)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Entrée créée')
        setIsDialogOpen(false)
        const res = await getTimeEntries()
        if (res.entries) setEntries(res.entries)
      }
    })
  }

  const handleDeleteEntry = (id: string) => {
    confirm({
      title: 'Supprimer cette entrée ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteTimeEntry(id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Entrée supprimée')
          setEntries(entries.filter(e => e.id !== id))
        }
      }
    })
  }

  const handleCreateInvoiceFromTime = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const projectId = formData.get('invoiceProjectId') as string
    const startDate = formData.get('invoiceStartDate') as string
    const endDate = formData.get('invoiceEndDate') as string
    const defaultRate = formData.get('defaultHourlyRate') as string
    if (!projectId || !startDate || !endDate) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    startTransition(async () => {
      const result = await createInvoiceFromTime({
        projectId,
        startDate,
        endDate,
        defaultHourlyRate: defaultRate ? parseFloat(defaultRate) : undefined,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Facture créée depuis vos heures !')
        setIsInvoiceDialogOpen(false)
        router.push(`/dashboard/invoices/${result.id}`)
      }
    })
  }

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.date
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {} as Record<string, TimeEntryWithRelations[]>)

  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <PageHeader
          title="Suivi du temps"
          description="Enregistrez et suivez vos heures de travail"
          icon={Clock}
          actions={
            <>
              <a href="/api/export/time" download>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </Button>
              </a>

              {timer ? (
                <Button
                  onClick={handleStopTimer}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-4 h-4 mr-2" />
                  {formatTimer(timerSeconds)}
                </Button>
              ) : (
                <TimerStartDialog
                  isOpen={isTimerDialogOpen}
                  onOpenChange={setIsTimerDialogOpen}
                  projects={projects}
                  isPending={isPending}
                  onSubmit={handleStartTimer}
                />
              )}

              <ManualEntryDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                projects={projects}
                isPending={isPending}
                onSubmit={handleCreateEntry}
              />

              <TimeInvoiceDialog
                isOpen={isInvoiceDialogOpen}
                onOpenChange={setIsInvoiceDialogOpen}
                projects={projects}
                isPending={isPending}
                onSubmit={handleCreateInvoiceFromTime}
              />
            </>
          } />
      </div>

      {/* Active Timer Banner */}
      {timer && (
        <ActiveTimerBanner
          timer={timer}
          timerSeconds={timerSeconds}
          isPending={isPending}
          onStop={handleStopTimer}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(summary.today + Math.floor(timerSeconds / 60))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatDuration(summary.week + Math.floor(timerSeconds / 60))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries List */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Clock}
                title="Aucune entrée"
                description="Commencez à suivre votre temps"
              />
            </CardContent>
          </Card>
        ) : (
          sortedDates.map((date) => {
            const dayEntries = groupedEntries[date]
            const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration, 0)

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-foreground capitalize">
                    {formatDateLabel(date)}
                  </h3>
                  <Badge variant="secondary" className="text-sm">
                    {formatDuration(dayTotal)}
                  </Badge>
                </div>

                <Card>
                  <CardContent className="p-0 divide-y">
                    {dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-muted">
                            <FolderKanban className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {entry.project?.name || 'Sans projet'}
                            </p>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground">{entry.description}</p>
                            )}
                            {entry.task && (
                              <p className="text-xs text-muted-foreground/70 mt-0.5">
                                Tâche: {entry.task.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-lg font-medium text-foreground">
                            {formatDurationShort(entry.duration)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
