'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Clock,
  Plus,
  Loader2,
  CheckCircle2,
  Pause,
  XCircle,
  MoreVertical,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { createTask, updateTaskStatus, deleteTask, getTasksByStatus, TaskFormData, TaskWithAssignee } from '@/lib/actions/tasks'
import { Project, Company, Quote, Task } from '@/types/db'
import { useConfirm } from '@/components/confirm-dialog'

type ProjectWithRelations = Project & {
  company: Company | null
  quote: Quote | null
  owner: { id: string; firstName: string | null; lastName: string | null } | null
  tasks: Task[]
}

type TasksByStatus = {
  todo: TaskWithAssignee[]
  in_progress: TaskWithAssignee[]
  review: TaskWithAssignee[]
  done: TaskWithAssignee[]
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Actif', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <Clock className="w-3 h-3" /> },
  paused: { label: 'En pause', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: <Pause className="w-3 h-3" /> },
  completed: { label: 'Terminé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: <XCircle className="w-3 h-3" /> },
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

const columns = [
  { id: 'todo', title: 'À faire', color: '#9ca3af' },
  { id: 'in_progress', title: 'En cours', color: '#3b82f6' },
  { id: 'review', title: 'En revue', color: '#f59e0b' },
  { id: 'done', title: 'Terminé', color: '#22c55e' },
]

// Draggable Task Card
function TaskCard({
  task,
  onDelete,
}: {
  task: TaskWithAssignee
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-lg border border-border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground text-sm">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDelete} className="text-red-600 dark:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Badge className={`${priorityColors[task.priority || 'medium']} text-xs`}>
          {task.priority === 'low' ? 'Basse' : task.priority === 'high' ? 'Haute' : task.priority === 'urgent' ? 'Urgente' : 'Moyenne'}
        </Badge>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
            {(task.assignee.firstName?.[0] || '?')}
          </div>
          <span className="text-xs text-muted-foreground">
            {task.assignee.firstName} {task.assignee.lastName?.[0]}.
          </span>
        </div>
      )}
    </div>
  )
}

// Droppable Column
function TaskColumn({
  column,
  tasks,
  onAddTask,
  onDeleteTask,
}: {
  column: { id: string; title: string; color: string }
  tasks: TaskWithAssignee[]
  onAddTask: (columnId: string) => void
  onDeleteTask: (taskId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[250px] rounded-lg transition-all duration-200 ${isOver
        ? 'bg-primary/5 ring-2 ring-primary/20'
        : 'bg-muted/50'
        }`}
    >
      {/* Column header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {/* Add button */}
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full p-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  )
}

export default function ProjectDetailClient({
  project,
  initialTasks,
}: {
  project: ProjectWithRelations
  initialTasks: TasksByStatus
}) {
  const [tasks, setTasks] = useState<TasksByStatus>(initialTasks)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>('todo')
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { confirm } = useConfirm()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  const status = statusConfig[project.status || 'active']

  const formatDate = (date: string | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatBudget = (amount: number | null) => {
    if (!amount) return null
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount / 100)
  }

  // Find task by ID across all columns
  const findTask = (id: string): TaskWithAssignee | null => {
    for (const columnTasks of Object.values(tasks)) {
      const task = columnTasks.find(t => t.id === id)
      if (task) return task
    }
    return null
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    // Find the task
    const task = findTask(taskId)
    if (!task) return

    // Determine target column
    let targetColumnId: string | null = null

    // Check if dropped on a column
    const targetColumn = columns.find(c => c.id === overId)
    if (targetColumn) {
      targetColumnId = targetColumn.id
    } else {
      // Dropped on another task - find its column
      for (const [columnId, columnTasks] of Object.entries(tasks)) {
        if (columnTasks.find(t => t.id === overId)) {
          targetColumnId = columnId
          break
        }
      }
    }

    if (targetColumnId && targetColumnId !== task.status) {
      // Optimistic update
      setTasks(prev => {
        const fromColumn = task.status as keyof TasksByStatus
        const toColumn = targetColumnId as keyof TasksByStatus
        return {
          ...prev,
          [fromColumn]: prev[fromColumn].filter(t => t.id !== taskId),
          [toColumn]: [...prev[toColumn], { ...task, status: targetColumnId }],
        }
      })

      // Server update
      const result = await updateTaskStatus(taskId, targetColumnId)
      if (result.error) {
        toast.error(result.error)
        // Reload on error
        const res = await getTasksByStatus(project.id)
        if (res.tasks) setTasks(res.tasks)
      }
    }
  }

  const handleOpenAddDialog = (columnId: string) => {
    setSelectedColumn(columnId)
    setIsTaskDialogOpen(true)
  }

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
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Tâche créée')
        setIsTaskDialogOpen(false)
        // Reload tasks
        const res = await getTasksByStatus(project.id)
        if (res.tasks) setTasks(res.tasks)
      }
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
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('Tâche supprimée')
          setTasks(prev => {
            const updated = { ...prev }
            for (const key of Object.keys(updated) as (keyof TasksByStatus)[]) {
              updated[key] = updated[key].filter(t => t.id !== taskId)
            }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Project Info */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mb-4">{project.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${status.color} flex items-center gap-1`}>
                {status.icon}
                {status.label}
              </Badge>
              {project.company && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  {project.company.name}
                </span>
              )}
              {project.startDate && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.startDate)}
                  {project.endDate && ` → ${formatDate(project.endDate)}`}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {project.budgetAmount && (
              <div className="text-2xl font-bold text-foreground">
                {formatBudget(project.budgetAmount)}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              {project.budgetType === 'fixed' ? 'Forfait' : project.budgetType === 'hourly' ? 'À l\'heure' : 'Abonnement'}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-foreground">Progression</span>
            <span className="text-muted-foreground">{completedTasks}/{totalTasks} tâches • {progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kanban Header */}
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
                  <select
                    name="priority"
                    defaultValue="medium"
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
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
                <Button type="button" variant="ghost" onClick={() => setIsTaskDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board with dnd-kit */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={tasks[column.id as keyof TasksByStatus]}
              onAddTask={handleOpenAddDialog}
              onDeleteTask={handleDeleteTask}
            />
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
    </div>
  )
}
