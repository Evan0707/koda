'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { getTemplateVariables } from '@/lib/contracts-definitions'
import type { Template } from './contracts-types'

export function TemplateDialog({
  isOpen,
  onOpenChange,
  editingTemplate,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingTemplate: Template | null
  isPending: boolean
  onSubmit: (formData: FormData) => void
}) {
  const variables = getTemplateVariables()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
          <DialogDescription>
            Les modèles permettent de créer des contrats rapidement
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du modèle</Label>
            <Input
              id="name"
              name="name"
              defaultValue={editingTemplate?.name}
              placeholder="Ex: Contrat de prestation standard"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                name="category"
                defaultValue={editingTemplate?.category || 'custom'}
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="nda">NDA</option>
                <option value="freelance">Freelance</option>
                <option value="service">Prestation de service</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={editingTemplate?.description || ''}
                placeholder="Description courte..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="templateContent">Contenu du modèle</Label>
              <span className="text-xs text-muted-foreground">Utilisez les variables pour personnaliser</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {variables.map(v => (
                <Badge key={v.key} variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                  {v.key}
                </Badge>
              ))}
            </div>
            <Textarea
              id="templateContent"
              name="content"
              defaultValue={editingTemplate?.content}
              placeholder="Contenu du modèle avec variables..."
              className="min-h-[300px] font-mono text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingTemplate ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
