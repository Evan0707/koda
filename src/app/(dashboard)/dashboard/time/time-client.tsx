'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
 Clock,
 Play,
 Square,
 Plus,
 Loader2,
 Trash2,
 FolderKanban,
 Timer,
} from 'lucide-react'
import {
 createTimeEntry,
 deleteTimeEntry,
 startTimer,
 stopTimer,
 getTimeEntries,
 TimeEntryFormData,
 TimeEntryWithRelations,
} from '@/lib/actions/time-entries'
import { Project } from '@/types/db'
import { useConfirm } from '@/components/confirm-dialog'

const formatDuration = (minutes: number) => {
 const hours = Math.floor(minutes / 60)
 const mins = minutes % 60
 if (hours > 0) {
  return `${hours}h ${mins.toString().padStart(2, '0')}min`
 }
 return `${mins}min`
}

const formatDurationShort = (minutes: number) => {
 const hours = Math.floor(minutes / 60)
 const mins = minutes % 60
 return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

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
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

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

 // Format live timer
 const formatTimer = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
 }

 // Start timer
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

 // Stop timer
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
    // Reload entries
    const res = await getTimeEntries()
    if (res.entries) setEntries(res.entries)
   }
  })
 }

 // Create manual entry
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
    // Reload entries
    const res = await getTimeEntries()
    if (res.entries) setEntries(res.entries)
   }
  })
 }

 // Delete entry
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

 const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
 }

 return (
  <div className="space-y-6 animate-fade-in">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-foreground">Suivi du temps</h1>
     <p className="text-muted-foreground">Enregistrez et suivez vos heures de travail</p>
    </div>

    <div className="flex items-center gap-3">
     {/* Timer button */}
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
      <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
       <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
         <Play className="w-4 h-4 mr-2" />
         Démarrer timer
        </Button>
       </DialogTrigger>
       <DialogContent>
        <DialogHeader>
         <DialogTitle>Démarrer un timer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleStartTimer} className="space-y-4">
         <div className="space-y-2">
          <Label>Projet *</Label>
          <select
           name="projectId"
           required
           className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
           <option value="">Sélectionner un projet</option>
           {projects.map((project) => (
            <option key={project.id} value={project.id}>
             {project.name}
            </option>
           ))}
          </select>
         </div>
         <div className="space-y-2">
          <Label>Description</Label>
          <Input name="description" placeholder="Sur quoi travaillez-vous ?" />
         </div>
         <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => setIsTimerDialogOpen(false)}>
           Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
           {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Démarrer'}
          </Button>
         </div>
        </form>
       </DialogContent>
      </Dialog>
     )}

     {/* Manual entry button */}
     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
       <Button variant="outline">
        <Plus className="w-4 h-4 mr-2" />
        Ajouter manuellement
       </Button>
      </DialogTrigger>
      <DialogContent>
       <DialogHeader>
        <DialogTitle>Nouvelle entrée</DialogTitle>
       </DialogHeader>
       <form onSubmit={handleCreateEntry} className="space-y-4">
        <div className="space-y-2">
         <Label>Projet *</Label>
         <select
          name="projectId"
          required
          className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
         >
          <option value="">Sélectionner un projet</option>
          {projects.map((project) => (
           <option key={project.id} value={project.id}>
            {project.name}
           </option>
          ))}
         </select>
        </div>
        <div className="space-y-2">
         <Label>Description</Label>
         <Input name="description" placeholder="Ce que vous avez fait..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label>Heures</Label>
          <Input name="hours" type="number" min="0" defaultValue="0" />
         </div>
         <div className="space-y-2">
          <Label>Minutes</Label>
          <Input name="minutes" type="number" min="0" max="59" defaultValue="0" />
         </div>
        </div>
        <div className="space-y-2">
         <Label>Date</Label>
         <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
        </div>
        <div className="flex justify-end gap-3 pt-4">
         <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
          Annuler
         </Button>
         <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
         </Button>
        </div>
       </form>
      </DialogContent>
     </Dialog>
    </div>
   </div>

   {/* Active Timer Banner */}
   {timer && (
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
         onClick={handleStopTimer}
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
      <CardContent className="py-12 text-center">
       <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
       <h3 className="text-lg font-medium text-foreground mb-2">
        Aucune entrée
       </h3>
       <p className="text-muted-foreground mb-4">
        Commencez à suivre votre temps
       </p>
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
