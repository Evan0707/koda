'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Play, Plus, Loader2, Receipt } from 'lucide-react'
import { Project } from '@/types/db'

type ProjectWithCompany = Project & { company: { name: string } | null }

export function TimerStartDialog({
  isOpen,
  onOpenChange,
  projects,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectWithCompany[]
  isPending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Play className="w-4 h-4 mr-2" />
          Démarrer timer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Démarrer un timer</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Projet *</Label>
            <select
              name="projectId"
              required
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" placeholder="Sur quoi travaillez-vous ?" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Démarrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ManualEntryDialog({
  isOpen,
  onOpenChange,
  projects,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectWithCompany[]
  isPending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter manuellement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle entrée</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Projet *</Label>
            <select
              name="projectId"
              required
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" placeholder="Ce que vous avez fait..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heures</Label>
              <Input name="hours" type="number" min="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label>Minutes</Label>
              <Input name="minutes" type="number" min="0" max="59" defaultValue="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TimeInvoiceDialog({
  isOpen,
  onOpenChange,
  projects,
  isPending,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectWithCompany[]
  isPending: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Receipt className="w-4 h-4 mr-2" />
          Facturer ce temps
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Facturer les heures</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Projet *</Label>
            <select
              name="invoiceProjectId"
              required
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Sélectionner un projet</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date début *</Label>
              <Input
                name="invoiceStartDate"
                type="date"
                required
                defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Date fin *</Label>
              <Input
                name="invoiceEndDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Taux horaire par défaut (€)</Label>
            <Input
              name="defaultHourlyRate"
              type="number"
              step="0.01"
              min="0"
              placeholder="50.00 (si non défini sur les entrées)"
            />
            <p className="text-xs text-muted-foreground">
              Utilisé si aucun taux n&apos;est défini sur les entrées de temps.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
              Générer la facture
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
