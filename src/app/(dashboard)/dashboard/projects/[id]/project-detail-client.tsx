'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  FileText,
  Receipt,
  ScrollText,
  Timer,
  BarChart3,
} from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'

import { createTask, updateTaskStatus, deleteTask, getTasksByStatus, TaskFormData, TaskWithAssignee } from '@/lib/actions/tasks'
import { useConfirm } from '@/components/confirm-dialog'
import { TaskColumn } from './project-kanban'
import {
  ProjectHubData,
  HubSummary,
  TasksByStatus,
  statusConfig,
  priorityColors,
  columns,
  formatCurrency,
  formatDate,
} from './project-hub-types'
import ProjectOverviewTab from './project-overview-tab'
import ProjectTimeTab from './project-time-tab'
import ProjectInvoicesTab from './project-invoices-tab'
import ProjectContractsTab from './project-contracts-tab'
import ProjectQuoteTab from './project-quote-tab'

export default function ProjectDetailClient({
  project,
  initialTasks,
  summary,
}: {
  project: ProjectHubData
  initialTasks: TasksByStatus
  summary: HubSummary
}) {
  const [tasks, setTasks] = useState<TasksByStatus>(initialTasks)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('todo')
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { confirm } = useConfirm()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const status = statusConfig[project.status || 'active']

  const findTask = (id: string): TaskWithAssignee | null => {
    for (const columnTasks of Object.values(tasks)) {
      const task = columnTasks.find(t => t.id === id)
      if (task) return task
    }
    return null
  }

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string
    const task = findTask(taskId)
    if (!task) return

    let targetColumnId: string | null = null
    const targetColumn = columns.find(c => c.id === overId)
    if (targetColumn) {
      targetColumnId = targetColumn.id
    } else {
      for (const [columnId, columnTasks] of Object.entries(tasks)) {
        if (columnTasks.find(t => t.id === overId)) { targetColumnId = columnId; break }
      }
    }

    if (targetColumnId && targetColumnId !== task.status) {
      setTasks(prev => {
        const fromColumn = task.status as keyof TasksByStatus
        const toColumn = targetColumnId as keyof TasksByStatus
        return { ...prev, [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId), [toColumn]: [...prev[toColumn], { ...task, status: targetColumnId }] }
      })
      const result = await updateTaskStatus(taskId, targetColumnId)
      if (result.error) { toast.error(result.error); const res = await getTasksByStatus(project.id); if (res.tasks) setTasks(res.tasks) }
    }
  }

  const handleOpenAddDialog = (columnId: string) => { setSelectedColumn(columnId); setIsTaskDialogOpen(true) }

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: TaskFormData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      projectId: project.id,
      status: selectedColumn as any,
      priority: (formData.get('priority') as any) || 'medium',
      dueDate: formData.get('dueDate') as string || undefined,
    }
    startTransition(async () => {
      const result = await createTask(data)
      if ('error' in result) { toast.error(result.error) }
      else { toast.success('Tâche créée'); setIsTaskDialogOpen(false); const res = await getTasksByStatus(project.id); if (res.tasks) setTasks(res.tasks) }
    })
  }

  const handleDeleteTask = (taskId: string) => {
    confirm({
      title: 'Supprimer cette tâche ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteTask(taskId)
        if ('error' in result) { toast.error(result.error) }
        else {
          toast.success('Tâche supprimée')
          setTasks(prev => {
            const updated = { ...prev }
            for (const key of Object.keys(updated) as (keyof TasksByStatus)[]) { updated[key] = updated[key].filter(t => t.id !== taskId) }
            return updated
          })
        }
      }
    })
  }

  const totalTasks = Object.values(tasks).flat().length
  const completedTasks = tasks.done.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const activeTask = activeId ? findTask(activeId) : null

  const budgetUsed = summary.invoiceTotal
  const budgetRatio = project.budgetAmount ? Math.round((budgetUsed / project.budgetAmount) * 100) : 0
  const hoursRatio = project.budgetHours ? Math.round((summary.totalHours / project.budgetHours) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Projets
          </Button>
        </Link>
      </div>

      {/* Project Info Card */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{project.name}</h1>
            {project.description && <p className="text-muted-foreground mb-4">{project.description}</p>}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${status.color} flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
              {project.company && (
                <Link href={`/dashboard/contacts?company=${project.company.id}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Building2 className="w-4 h-4" />
                  {project.company.name}
                </Link>
              )}
              {project.startDate && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.startDate)}
                  {project.endDate && `  ${formatDate(project.endDate)}`}
                </span>
              )}
              {project.owner && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                    {project.owner.firstName?.[0] || '?'}
                  </div>
                  {project.owner.firstName} {project.owner.lastName?.[0]}.
                </span>
              )}
              {project.manager && project.manager.id !== project.owner?.id && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-xs font-medium text-orange-700 dark:text-orange-300">
                    {project.manager.firstName?.[0] || '?'}
                  </div>
                  {project.manager.firstName} {project.manager.lastName?.[0]}.
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {project.budgetAmount ? (
              <div className="text-2xl font-bold text-foreground">{formatCurrency(project.budgetAmount)}</div>
            ) : null}
            <div className="text-sm text-muted-foreground">
              {project.budgetType === 'fixed' ? 'Forfait' : project.budgetType === 'hourly' ? 'À l\'heure' : 'Abonnement'}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Progression</span>
            <span className="text-muted-foreground">{completedTasks}/{totalTasks} tâches  {progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border w-full overflow-x-auto justify-start">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Tâches
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{totalTasks}</span>
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-1.5">
            <Timer className="w-4 h-4" />
            Temps
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{summary.timeEntryCount}</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4" />
            Factures
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{summary.invoiceCount}</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" />
            Contrats
            <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{summary.contractCount}</span>
          </TabsTrigger>
          {project.quote && (
            <TabsTrigger value="quote" className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Devis
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProjectOverviewTab
            project={project}
            summary={summary}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            progress={progress}
            budgetUsed={budgetUsed}
            budgetRatio={budgetRatio}
            hoursRatio={hoursRatio}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Tâches</h2>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle tâche</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre *</Label>
                    <Input name="title" placeholder="Ex: Créer la maquette" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" placeholder="Description de la tâche..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <select name="priority" defaultValue="medium" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer">
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date limite</Label>
                      <Input name="dueDate" type="date" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsTaskDialogOpen(false)}>Annuler</Button>
                    <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((column) => (
                <TaskColumn key={column.id} column={column} tasks={tasks[column.id as keyof TasksByStatus]} onAddTask={handleOpenAddDialog} onDeleteTask={handleDeleteTask} />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="bg-card rounded-lg border border-border shadow-lg p-3 w-64 rotate-2">
                  <p className="font-medium text-foreground text-sm">{activeTask.title}</p>
                  <Badge className={`${priorityColors[activeTask.priority || 'medium']} text-xs mt-2`}>
                    {activeTask.priority === 'low' ? 'Basse' : activeTask.priority === 'high' ? 'Haute' : activeTask.priority === 'urgent' ? 'Urgente' : 'Moyenne'}
                  </Badge>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <ProjectTimeTab project={project} summary={summary} />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <ProjectInvoicesTab project={project} summary={summary} />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <ProjectContractsTab project={project} />
        </TabsContent>

        {project.quote && (
          <TabsContent value="quote" className="space-y-4">
            <ProjectQuoteTab quote={project.quote} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
