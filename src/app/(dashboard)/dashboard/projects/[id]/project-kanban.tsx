'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, MoreVertical, Plus, Trash2 } from 'lucide-react'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { TaskWithAssignee } from '@/lib/actions/tasks'
import { priorityColors } from './project-hub-types'

export function TaskCard({ task, onDelete }: { task: TaskWithAssignee; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-lg border border-border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all" {...attributes} {...listeners}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground text-sm">{task.title}</p>
          {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
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
          <span className="text-xs text-muted-foreground">{task.assignee.firstName} {task.assignee.lastName?.[0]}.</span>
        </div>
      )}
    </div>
  )
}

export function TaskColumn({ column, tasks, onAddTask, onDeleteTask }: {
  column: { id: string; title: string; color: string }
  tasks: TaskWithAssignee[]
  onAddTask: (columnId: string) => void
  onDeleteTask: (taskId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[250px] rounded-lg transition-all duration-200 ${isOver ? 'bg-primary/5 ring-2 ring-primary/20' : 'bg-muted/50'}`}>
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
            <h3 className="font-semibold text-foreground text-sm">{column.title}</h3>
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{tasks.length}</span>
          </div>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)}>
          {tasks.map((task) => <TaskCard key={task.id} task={task} onDelete={() => onDeleteTask(task.id)} />)}
        </SortableContext>
        <button onClick={() => onAddTask(column.id)} className="w-full p-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors flex items-center justify-center gap-1 text-sm">
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  )
}

export function StatCard({ icon, label, value, subValue, color }: {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  color?: string
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-lg ${color || 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
    </div>
  )
}
