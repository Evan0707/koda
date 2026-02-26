'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AlertCircle, Target } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
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
import { getPipelineStages, createDefaultStages } from '@/lib/actions/pipeline'
import { getOpportunities, createOpportunity, updateOpportunity, deleteOpportunity, moveOpportunityToStage } from '@/lib/actions/opportunities'
import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { PipelineSettings } from './pipeline-settings'
import { useConfirm } from '@/components/confirm-dialog'
import { triggerFireworks } from '@/lib/confetti'
import { formatPrice } from '@/lib/currency'
import type { Stage, Opportunity, Company, Contact } from './pipeline-types'
import { OpportunityCard, StageColumn } from './pipeline-kanban'
import { OpportunityDialog } from './opportunity-dialog'

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const opportunityId = active.id as string
    const overId = over.id as string
    const opportunity = opportunities.find(o => o.id === opportunityId)
    if (!opportunity) return

    let targetStageId: string | null = null
    const targetStage = stages.find(s => s.id === overId)
    if (targetStage) {
      targetStageId = targetStage.id
    } else {
      const targetOpp = opportunities.find(o => o.id === overId)
      if (targetOpp) {
        targetStageId = targetOpp.stage_id
      }
    }

    if (targetStageId && targetStageId !== opportunity.stage_id) {
      setOpportunities(prev =>
        prev.map(o => o.id === opportunityId ? { ...o, stage_id: targetStageId! } : o)
      )
      const result = await moveOpportunityToStage(opportunityId, targetStageId)
      if (result.error) {
        toast.error(result.error)
        loadData()
      }
    }
  }

  const openAddDialog = (stageId: string) => {
    setSelectedStageId(stageId)
    setEditingOpportunity(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity)
    setSelectedStageId(opportunity.stage_id)
    setIsDialogOpen(true)
  }

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
      if ('error' in result) {
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

  const handleDelete = (id: string) => {
    confirm({
      title: 'Supprimer cette opportunité ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteOpportunity(id)
        if ('error' in result) {
          toast.error(result.error)
        } else {
          toast.success('Opportunité supprimée')
          loadData()
        }
      }
    })
  }

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
        toast.success(' Opportunité gagnée !')
        loadData()
      }
    })
  }

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

  const getStageOpportunities = (stageId: string) => {
    return opportunities
      .filter(o => o.stage_id === stageId)
      .filter(o => {
        if (filterCompany && o.company_id !== filterCompany) return false
        if (filterOverdue && (!o.expected_close_date || new Date(o.expected_close_date) >= new Date())) return false
        return true
      })
  }

  const totalPipelineValue = opportunities
    .filter(o => !stages.find(s => s.id === o.stage_id)?.isWon && !stages.find(s => s.id === o.stage_id)?.isLost)
    .reduce((sum, o) => sum + o.value, 0)

  const weightedPipelineValue = opportunities
    .filter(o => !stages.find(s => s.id === o.stage_id)?.isWon && !stages.find(s => s.id === o.stage_id)?.isLost)
    .reduce((sum, o) => sum + Math.round(o.value * o.probability / 100), 0)

  const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <PageHeader
          title="Pipeline"
          icon={Target}
          description={`${formatPrice(totalPipelineValue, 'EUR', { compact: true })} (${formatPrice(weightedPipelineValue, 'EUR', { compact: true })} pondéré)`}
          actions={
            <>
              <Select value={filterCompany || '__all__'} onValueChange={(v) => setFilterCompany(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-9 min-w-[180px]">
                  <SelectValue placeholder="Toutes entreprises" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes entreprises</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={filterOverdue ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterOverdue(!filterOverdue)}
                className={filterOverdue ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                En retard
              </Button>
              <PipelineSettings stages={stages} onUpdate={loadData} />
              <OpportunityDialog
                isOpen={isDialogOpen}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) {
                    setEditingOpportunity(null)
                    setSelectedStageId(null)
                  }
                }}
                editingOpportunity={editingOpportunity}
                selectedStageId={selectedStageId}
                onSelectedStageChange={setSelectedStageId}
                stages={stages}
                companies={companies}
                isPending={isPending}
                onSubmit={handleSubmit}
              />
            </>
          }
        />
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
                  {formatPrice(activeOpportunity.value, 'EUR', { compact: true })}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
