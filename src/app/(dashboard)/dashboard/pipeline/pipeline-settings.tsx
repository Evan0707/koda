'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
 DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Plus, Trash2, GripVertical, Pencil } from 'lucide-react'
import {
 createStage,
 updateStage,
 deleteStage,
 reorderStages
} from '@/lib/actions/pipeline'
import { toast } from 'sonner'
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
 verticalListSortingStrategy,
 useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useConfirm } from '@/components/confirm-dialog'

type Stage = {
 id: string
 name: string
 color: string
 position: number
 isWon: boolean
 isLost: boolean
}

type PipelineSettingsProps = {
 stages: Stage[]
 onUpdate: () => void
}

function SortableStage({ stage, onEdit, onDelete }: {
 stage: Stage
 onEdit: () => void
 onDelete: () => void
}) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
 } = useSortable({ id: stage.id })

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
 }

 return (
  <div
   ref={setNodeRef}
   style={style}
   className="flex items-center justify-between p-3 bg-card border border-border rounded-lg mb-2 group shadow-sm"
  >
   <div className="flex items-center gap-3">
    <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
     <GripVertical className="w-4 h-4" />
    </button>
    <div
     className="w-4 h-4 rounded-full"
     style={{ backgroundColor: stage.color }}
    />
    <span className="font-medium text-sm text-foreground">{stage.name}</span>
    {(stage.isWon || stage.isLost) && (
     <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
      {stage.isWon ? 'Gagné' : 'Perdu'}
     </span>
    )}
   </div>
   <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
    <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
     <Pencil className="w-4 h-4 text-muted-foreground" />
    </Button>
    {!stage.isWon && !stage.isLost && (
     <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="w-4 h-4" />
     </Button>
    )}
   </div>
  </div>
 )
}

export function PipelineSettings({ stages, onUpdate }: PipelineSettingsProps) {
 const [isOpen, setIsOpen] = useState(false)
 const [editingStage, setEditingStage] = useState<Stage | null>(null)
 const [isFormOpen, setIsFormOpen] = useState(false)
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

 // Sortable setup
 const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
   coordinateGetter: sortableKeyboardCoordinates,
  })
 )

 const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event

  if (active.id !== over?.id) {
   const oldIndex = stages.findIndex((s) => s.id === active.id)
   const newIndex = stages.findIndex((s) => s.id === over?.id)

   const newOrder = arrayMove(stages, oldIndex, newIndex)

   // Optimistic update calling parent would be better, but for settings we might just wait
   // Actually we just call server action

   startTransition(async () => {
    const result = await reorderStages(newOrder.map(s => s.id))
    if (result.error) {
     toast.error(result.error)
    } else {
     onUpdate()
    }
   })
  }
 }

 const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
   let result
   if (editingStage) {
    result = await updateStage(editingStage.id, formData)
   } else {
    result = await createStage(formData)
   }

   if ('error' in result) {
    toast.error(result.error)
   } else {
    toast.success(editingStage ? 'Étape modifiée' : 'Étape créée')
    setIsFormOpen(false)
    setEditingStage(null)
    onUpdate()
   }
  })
 }

 const handleDelete = (id: string) => {
  confirm({
   title: 'Supprimer cette étape ?',
   description: 'Les opportunités associées seront perdues ou devront être déplacées.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteStage(id)
    if ('error' in result) {
     toast.error(result.error)
    } else {
     toast.success('Étape supprimée')
     onUpdate()
    }
   }
  })
 }

 // Pre-defined colors
 const colors = [
  '#6B7280', // Gray
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
 ]

 return (
  <>
   <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
    <Settings className="w-4 h-4 mr-2" />
    Configurer
   </Button>

   <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>Configuration du Pipeline</DialogTitle>
      <DialogDescription>
       Gérez les étapes de votre cycle de vente.
      </DialogDescription>
     </DialogHeader>

     {isFormOpen ? (
      <form action={handleSubmit} className="space-y-4">
       <div className="space-y-2">
        <Label>Nom de l'étape</Label>
        <Input
         name="name"
         defaultValue={editingStage?.name}
         required
         placeholder="Ex: Qualification"
        />
       </div>

       <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex flex-wrap gap-2">
         {colors.map(color => (
          <label key={color} className="cursor-pointer">
           <input
            type="radio"
            name="color"
            value={color}
            defaultChecked={editingStage?.color === color || (!editingStage && color === '#6366F1')}
            className="sr-only peer"
           />
           <div className="w-8 h-8 rounded-full bg-current border-2 border-transparent peer-checked:border-foreground peer-checked:scale-110 transition-all shadow-sm" style={{ color }} />
          </label>
         ))}
        </div>
       </div>

       <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={() => { setIsFormOpen(false); setEditingStage(null); }}>
         Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
         {editingStage ? 'Modifier' : 'Créer'}
        </Button>
       </div>
      </form>
     ) : (
      <div className="space-y-4">
       <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
       >
        <SortableContext
         items={stages.map(s => s.id)}
         strategy={verticalListSortingStrategy}
        >
         <div className="space-y-1">
          {stages.map((stage) => (
           <SortableStage
            key={stage.id}
            stage={stage}
            onEdit={() => { setEditingStage(stage); setIsFormOpen(true); }}
            onDelete={() => handleDelete(stage.id)}
           />
          ))}
         </div>
        </SortableContext>
       </DndContext>

       <Button
        onClick={() => { setEditingStage(null); setIsFormOpen(true); }}
        className="w-full"
        variant="outline"
       >
        <Plus className="w-4 h-4 mr-2" />
        Ajouter une étape
       </Button>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </>
 )
}
