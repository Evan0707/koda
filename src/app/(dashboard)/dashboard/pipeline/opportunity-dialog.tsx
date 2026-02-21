'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import type { Stage, Opportunity, Company } from './pipeline-types'

export function OpportunityDialog({
  isOpen,
  onOpenChange,
  editingOpportunity,
  selectedStageId,
  onSelectedStageChange,
  stages,
  companies,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingOpportunity: Opportunity | null
  selectedStageId: string | null
  onSelectedStageChange: (stageId: string) => void
  stages: Stage[]
  companies: Company[]
  isPending: boolean
  onSubmit: (formData: FormData) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
        <form action={onSubmit} className="space-y-4">
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
              onChange={(e) => onSelectedStageChange(e.target.value)}
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
              onClick={() => onOpenChange(false)}
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
  )
}
