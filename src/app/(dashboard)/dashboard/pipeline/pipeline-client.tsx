'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Target,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
  Building2,
  Euro,
  Calendar,
  Loader2,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
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
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { getPipelineStages, createDefaultStages } from '@/lib/actions/pipeline'
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, moveOpportunityToStage } from '@/lib/actions/opportunities'
import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { PipelineSettings } from './pipeline-settings'
import { useConfirm } from '@/components/confirm-dialog'
import { triggerFireworks } from '@/lib/confetti'

type Stage = {
  id: string
  name: string
  color: string
  position: number
  isWon: boolean
  isLost: boolean
}

type Opportunity = {
  id: string
  name: string
  value: number
  probability: number
  stage_id: string
  company_id: string | null
  expected_close_date: string | null
  companies: { id: string; name: string } | null
  contacts: { id: string; first_name: string; last_name: string } | null
  pipeline_stages: Stage | null
}

type Company = { id: string; name: string }
type Contact = { id: string; first_name: string; last_name: string | null }

// Draggable opportunity card
function OpportunityCard({
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

  const formatValue = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(cents / 100)
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
              {formatValue(opportunity.value)}
            </span>
            <span className="text-muted-foreground/70">
              → {formatValue(weightedValue)}
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
function StageColumn({
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
  const formatValue = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(cents / 100)
  }

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
          {formatValue(totalValue)} <span className="text-muted-foreground/50">→ {formatValue(weightedTotal)}</span>
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

export default function PipelineClient() {
  const [stages, setStages] = useState<Stage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const { confirm } = useConfirm()
  // Filters
  const [filterCompany, setFilterCompany] = useState<string>('')
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  )

  // Load data
  const loadData = async () => {
    setIsLoading(true)
    const [stagesRes, oppsRes, companiesRes, contactsRes] = await Promise.all([
      getPipelineStages(),
      getOpportunities(),
      getCompanies(),
      getContacts(),
    ])

    if (stagesRes.stages) {
      // If no stages exist, create defaults
      if (stagesRes.stages.length === 0) {
        const defaultRes = await createDefaultStages()
        if (defaultRes.stages) {
          setStages(defaultRes.stages as Stage[])
        }
      } else {
        setStages(stagesRes.stages as Stage[])
      }
    }

    if (oppsRes.opportunities) {
      setOpportunities(oppsRes.opportunities as Opportunity[])
    }
    if (companiesRes.companies) {
      setCompanies(companiesRes.companies as Company[])
    }
    if (contactsRes.contacts) {
      setContacts(contactsRes.contacts as Contact[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const opportunityId = active.id as string
    const overId = over.id as string

    // Find the opportunity and target stage
    const opportunity = opportunities.find(o => o.id === opportunityId)
    if (!opportunity) return

    // Check if dropped on a stage or another opportunity
    let targetStageId: string | null = null

    // Check if dropped on a stage
    const targetStage = stages.find(s => s.id === overId)
    if (targetStage) {
      targetStageId = targetStage.id
    } else {
      // Dropped on another opportunity - find its stage
      const targetOpp = opportunities.find(o => o.id === overId)
      if (targetOpp) {
        targetStageId = targetOpp.stage_id
      }
    }

    if (targetStageId && targetStageId !== opportunity.stage_id) {
      // Optimistic update
      setOpportunities(prev =>
        prev.map(o => o.id === opportunityId ? { ...o, stage_id: targetStageId! } : o)
      )

      // Server update
      const result = await moveOpportunityToStage(opportunityId, targetStageId)
      if (result.error) {
        toast.error(result.error)
        loadData() // Reload on error
      }
    }
  }

  // Open add dialog
  const openAddDialog = (stageId: string) => {
    setSelectedStageId(stageId)
    setEditingOpportunity(null)
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setSelectedStageId(opportunity.stage_id)
    setIsDialogOpen(true)
  }

  // Handle form submit
  const handleSubmit = async (formData: FormData) => {
    if (selectedStageId) {
      formData.set('stageId', selectedStageId)
    }

    startTransition(async () => {
      let result
      if (editingOpportunity) {
        result = await updateOpportunity(editingOpportunity.id, formData)
      } else {
        result = await createOpportunity(formData)
      }

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editingOpportunity ? 'Opportunité modifiée' : 'Opportunité créée')
        setIsDialogOpen(false)
        setEditingOpportunity(null)
        setSelectedStageId(null)
        loadData()
      }
    })
  }

  // Handle delete
  const handleDelete = (id: string) => {
    confirm({
      title: 'Supprimer cette opportunité ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteOpportunity(id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Opportunité supprimée')
          loadData()
        }
      }
    })
  }

  // Handle win
  const handleWin = async (id: string) => {
    const wonStage = stages.find(s => s.isWon)
    if (!wonStage) {
      toast.error('Aucune étape "Gagné" configurée')
      return
    }

    startTransition(async () => {
      const result = await moveOpportunityToStage(id, wonStage.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        triggerFireworks()
        toast.success('🎉 Opportunité gagnée !')
        loadData()
      }
    })
  }

  // Handle lose
  const handleLose = async (id: string) => {
    const lostStage = stages.find(s => s.isLost)
    if (!lostStage) {
      toast.error('Aucune étape "Perdu" configurée')
      return
    }

    startTransition(async () => {
      const result = await moveOpportunityToStage(id, lostStage.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.info('Opportunité perdue')
        loadData()
      }
    })
  }

  // Get opportunities for a stage (with filter)
  const getStageOpportunities = (stageId: string) => {
    return opportunities
      .filter(o => o.stage_id === stageId)
      .filter(o => {
        if (filterCompany && o.company_id !== filterCompany) return false
        if (filterOverdue && (!o.expected_close_date || new Date(o.expected_close_date) >= new Date())) return false
        return true
      })
  }

  // Calculate total pipeline value
  const totalPipelineValue = opportunities
    .filter(o => !stages.find(s => s.id === o.stage_id)?.isWon && !stages.find(s => s.id === o.stage_id)?.isLost)
    .reduce((sum, o) => sum + o.value, 0)

  const weightedPipelineValue = opportunities
    .filter(o => !stages.find(s => s.id === o.stage_id)?.isWon && !stages.find(s => s.id === o.stage_id)?.isLost)
    .reduce((sum, o) => sum + Math.round(o.value * o.probability / 100), 0)

  const formatValue = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-muted-foreground">
            {formatValue(totalPipelineValue)} <span className="text-muted-foreground/70">→ {formatValue(weightedPipelineValue)} pondéré</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filters */}
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Toutes entreprises</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <Button
            variant={filterOverdue ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOverdue(!filterOverdue)}
            className={filterOverdue ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            En retard
          </Button>
          <PipelineSettings
            stages={stages}
            onUpdate={loadData}
          />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setEditingOpportunity(null)
              setSelectedStageId(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle opportunité
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingOpportunity ? 'Modifier l\'opportunité' : 'Nouvelle opportunité'}
                </DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    name="name"
                    placeholder="Nom de l'opportunité"
                    defaultValue={editingOpportunity?.name || ''}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valeur (€)</Label>
                    <Input
                      name="value"
                      type="number"
                      placeholder="10000"
                      defaultValue={editingOpportunity ? editingOpportunity.value / 100 : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Probabilité (%)</Label>
                    <Input
                      name="probability"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="50"
                      defaultValue={editingOpportunity?.probability || 50}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entreprise</Label>
                    <select
                      name="companyId"
                      defaultValue={editingOpportunity?.company_id || ''}
                      className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="">Aucune</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date de clôture prévue</Label>
                    <Input
                      name="expectedCloseDate"
                      type="date"
                      defaultValue={editingOpportunity?.expected_close_date?.split('T')[0] || ''}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Étape</Label>
                  <select
                    name="stageId"
                    value={selectedStageId || editingOpportunity?.stage_id || stages[0]?.id || ''}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingOpportunity ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 bg-muted/50 rounded-lg">
              <div className="p-3 border-b border-border">
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="p-2 space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                stages={stages}
                opportunities={getStageOpportunities(stage.id)}
                onAddOpportunity={openAddDialog}
                onEditOpportunity={openEditDialog}
                onDeleteOpportunity={handleDelete}
                onWinOpportunity={handleWin}
                onLoseOpportunity={handleLose}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOpportunity ? (
              <div className="bg-card rounded-lg border shadow-lg p-3 w-72 rotate-2">
                <h4 className="font-medium text-foreground text-sm">
                  {activeOpportunity.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatValue(activeOpportunity.value)}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
