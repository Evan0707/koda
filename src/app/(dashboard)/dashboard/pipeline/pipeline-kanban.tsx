'use client'

import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  Euro,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatPrice } from '@/lib/currency'
import type { Stage, Opportunity } from './pipeline-types'

// Draggable opportunity card
export function OpportunityCard({
  opportunity,
  stages,
  onEdit,
  onDelete,
  onWin,
  onLose,
}: {
  opportunity: Opportunity
  stages: Stage[]
  onEdit: () => void
  onDelete: () => void
  onWin: () => void
  onLose: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Check if overdue
  const isOverdue = opportunity.expected_close_date
    ? new Date(opportunity.expected_close_date) < new Date()
    : false

  // Weighted value
  const weightedValue = Math.round(opportunity.value * opportunity.probability / 100)

  // Check if in final stages
  const currentStage = stages.find(s => s.id === opportunity.stage_id)
  const isInFinalStage = currentStage?.isWon || currentStage?.isLost

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${isOverdue ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20' : ''
        }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-foreground text-sm line-clamp-2">
          {opportunity.name}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 -mr-1 -mt-1">
              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {!isInFinalStage && (
              <>
                <DropdownMenuItem onClick={onWin} className="text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer Gagné
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLose} className="text-orange-600 dark:text-orange-400">
                  <XCircle className="w-4 h-4 mr-2" />
                  Marquer Perdu
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {opportunity.companies && (
          <div className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{opportunity.companies.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Euro className="w-3 h-3" />
            <span className="font-semibold text-foreground">
              {formatPrice(opportunity.value, 'EUR', { compact: true })}
            </span>
            <span className="text-muted-foreground/70">
              → {formatPrice(weightedValue, 'EUR', { compact: true })}
            </span>
          </div>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
            {opportunity.probability}%
          </span>
        </div>
        {opportunity.expected_close_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
            {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            <span>
              {new Date(opportunity.expected_close_date).toLocaleDateString('fr-FR')}
              {isOverdue && ' (en retard)'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Stage column with droppable support
export function StageColumn({
  stage,
  stages,
  opportunities,
  onAddOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onWinOpportunity,
  onLoseOpportunity,
}: {
  stage: Stage
  stages: Stage[]
  opportunities: Opportunity[]
  onAddOpportunity: (stageId: string) => void
  onEditOpportunity: (opp: Opportunity) => void
  onDeleteOpportunity: (id: string) => void
  onWinOpportunity: (id: string) => void
  onLoseOpportunity: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0)
  const weightedTotal = opportunities.reduce((sum, opp) => sum + Math.round(opp.value * opp.probability / 100), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-lg transition-all duration-200 ${isOver
        ? 'bg-primary/10 ring-2 ring-primary/40 ring-offset-2'
        : 'bg-muted/50'
        }`}
    >
      {/* Stage header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-foreground text-sm">{stage.name}</h3>
            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {opportunities.length}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {formatPrice(totalValue, 'EUR', { compact: true })} <span className="text-muted-foreground/50">→ {formatPrice(weightedTotal, 'EUR', { compact: true })}</span>
        </p>
      </div>

      {/* Opportunities */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext items={opportunities.map(o => o.id)}>
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              stages={stages}
              onEdit={() => onEditOpportunity(opportunity)}
              onDelete={() => onDeleteOpportunity(opportunity.id)}
              onWin={() => onWinOpportunity(opportunity.id)}
              onLose={() => onLoseOpportunity(opportunity.id)}
            />
          ))}
        </SortableContext>

        {/* Add button */}
        <button
          onClick={() => onAddOpportunity(stage.id)}
          className="w-full p-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  )
}
