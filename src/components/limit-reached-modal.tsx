'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Zap, Crown } from 'lucide-react'
import Link from 'next/link'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  limitType: 'invoices' | 'quotes' | 'contacts' | 'ai'
}

export function LimitReachedModal({
  isOpen,
  onClose,
  currentPlan,
  limitType,
}: LimitReachedModalProps) {

  const getContent = () => {
    switch (limitType) {
      case 'invoices':
        return {
          title: 'Limite de factures atteinte',
          description: `Votre plan ${currentPlan} ne vous permet plus de créer de factures ce mois-ci.`,
          limit: currentPlan === 'free' ? '10/mois' : '100/mois',
          nextLimit: currentPlan === 'free' ? '100/mois' : 'Illimité',
        }
      case 'quotes':
        return {
          title: 'Limite de devis atteinte',
          description: `Votre plan ${currentPlan} ne vous permet plus de créer de devis ce mois-ci.`,
          limit: currentPlan === 'free' ? '10/mois' : '100/mois',
          nextLimit: currentPlan === 'free' ? '100/mois' : 'Illimité',
        }
      case 'contacts':
        return {
          title: 'Limite de contacts atteinte',
          description: `Votre plan ${currentPlan} a atteint sa limite de contacts.`,
          limit: currentPlan === 'free' ? '50 contacts' : '500 contacts',
          nextLimit: currentPlan === 'free' ? '500 contacts' : 'Illimité',
        }
      case 'ai':
        return {
          title: 'Fonctionnalité IA non disponible',
          description: `La génération d'email par IA est réservée aux plans payants.`,
          limit: 'Non inclus',
          nextLimit: 'Inclus ✓',
        }
      default:
        return {
          title: 'Limite atteinte',
          description: 'Vous avez atteint les limites de votre plan actuel.',
          limit: '-',
          nextLimit: '-',
        }
    }
  }

  const content = getContent()
  const nextPlan = currentPlan === 'free' ? 'starter' : 'pro'
  const nextPlanName = currentPlan === 'free' ? 'Starter' : 'Pro'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-center text-xl">{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4 p-4 bg-muted rounded-lg border">
          <div className="text-center border-r border-border">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Actuel</p>
            <p className="text-lg font-semibold text-foreground">{content.limit}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary uppercase font-bold mb-1">Avec {nextPlanName}</p>
            <p className="text-lg font-semibold text-primary flex items-center justify-center gap-1">
              {content.nextLimit}
              <Check className="w-4 h-4 ml-1" />
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button asChild className="w-full bg-primary hover:bg-primary/90" size="lg">
            <Link href={`/dashboard/upgrade?plan=${nextPlan}`}>
              Passer au plan {nextPlanName}
            </Link>
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Plus tard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
