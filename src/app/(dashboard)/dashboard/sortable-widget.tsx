'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SortableWidget({
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
