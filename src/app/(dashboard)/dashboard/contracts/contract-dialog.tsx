'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2 } from 'lucide-react'
import { ContractFormData, getTemplateVariables } from '@/lib/contracts-definitions'
import type { Company, Contact } from './contracts-types'

export function ContractDialog({
  isOpen,
  onOpenChange,
  contractForm,
  onFormChange,
  companies,
  contacts,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  contractForm: ContractFormData
  onFormChange: (form: ContractFormData) => void
  companies: Company[]
  contacts: Contact[]
  isPending: boolean
  onSubmit: () => void
}) {
  const variables = getTemplateVariables()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau contrat</DialogTitle>
          <DialogDescription>
            Créez un nouveau contrat ou personnalisez un modèle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du contrat</Label>
            <Input
              id="title"
              value={contractForm.title}
              onChange={(e) => onFormChange({ ...contractForm, title: e.target.value })}
              placeholder="Ex: Contrat de prestation - Client ABC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyId">Entreprise</Label>
              <select
                id="companyId"
                value={contractForm.companyId || ''}
                onChange={(e) => onFormChange({ ...contractForm, companyId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">Sélectionner...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactId">Contact</Label>
              <select
                id="contactId"
                value={contractForm.contactId || ''}
                onChange={(e) => onFormChange({ ...contractForm, contactId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border bg-background text-sm"
              >
                <option value="">Sélectionner...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Date d&apos;effet</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={contractForm.effectiveDate || ''}
                onChange={(e) => onFormChange({ ...contractForm, effectiveDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Date d&apos;expiration</Label>
              <Input
                id="expirationDate"
                type="date"
                value={contractForm.expirationDate || ''}
                onChange={(e) => onFormChange({ ...contractForm, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Contenu</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Insérer variable
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {variables.map(v => (
                    <DropdownMenuItem
                      key={v.key}
                      onClick={() => onFormChange({
                        ...contractForm,
                        content: contractForm.content + v.key,
                      })}
                    >
                      <span className="font-mono text-xs mr-2">{v.key}</span>
                      <span className="text-muted-foreground">{v.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Textarea
              id="content"
              value={contractForm.content}
              onChange={(e) => onFormChange({ ...contractForm, content: e.target.value })}
              placeholder="Contenu du contrat..."
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Créer le contrat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
