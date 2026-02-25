'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface LimitReachedModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: string
  limitType: 'invoices' | 'quotes' | 'contacts' | 'ai'
}

const STARTER_FEATURES = [
  'Factures illimitées',
  'Génération email par IA',
  'Envoi depuis Gmail',
  'Devis illimités',
  'Export PDF & FEC',
  'Paiements Stripe intégrés',
  'Automatisations',
  'Support prioritaire',
]

const PRO_FEATURES = [
  'Tout du Starter',
  'Contacts illimités',
  'Multi-utilisateurs',
  'API complète',
  'Rapports avancés',
  'Commission 0%',
  'Intégrations sur mesure',
  'Accompagnement dédié',
]

const PRICING = {
  starter: { monthly: 29, annual: 22 },
  pro: { monthly: 79, annual: 59 },
}

export function LimitReachedModal({
  isOpen,
  onClose,
  currentPlan,
  limitType,
}: LimitReachedModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  const nextPlan = currentPlan === 'free' ? 'starter' : 'pro'
  const nextPlanName = currentPlan === 'free' ? 'Starter' : 'Pro'
  const features = currentPlan === 'free' ? STARTER_FEATURES : PRO_FEATURES
  const price = PRICING[nextPlan]
  const displayPrice = billing === 'monthly' ? price.monthly : price.annual

  const getTitle = () => {
    switch (limitType) {
      case 'ai': return 'Débloquer l\'IA'
      case 'quotes': return 'Plus de devis disponibles'
      case 'invoices': return 'Plus de factures disponibles'
      case 'contacts': return 'Limite de contacts atteinte'
      default: return 'Passez à la vitesse supérieure'
    }
  }

  const getDescription = () => {
    switch (limitType) {
      case 'ai': return 'La génération d\'email par IA est réservée aux plans payants. Passez au plan Starter pour débloquer cette fonctionnalité.'
      case 'quotes': return `Votre plan actuel ne vous permet plus de créer de devis. Passez au plan ${nextPlanName} pour continuer.`
      case 'invoices': return `Votre plan actuel ne vous permet plus de créer de factures ce mois-ci. Passez au plan ${nextPlanName} pour continuer.`
      case 'contacts': return `Vous avez atteint la limite de contacts de votre plan. Passez au plan ${nextPlanName} pour plus d'espace.`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground mb-2">
            Passer au plan {nextPlanName} !
          </DialogTitle>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            {getDescription()}
          </p>

          {/* Billing Toggle */}
          <div className="mt-5 inline-flex items-center bg-muted rounded-full p-1 relative">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${billing === 'monthly'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billing === 'annual'
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Annuel
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${billing === 'annual' ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary'
                }`}>
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Features grid */}
        <div className="px-8 pb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ce que vous obtenez
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            *Le taux de TVA standard peut être appliqué selon votre pays.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border flex items-center justify-between px-8 py-5 bg-muted/30">
          <div>
            <span className="text-3xl font-bold text-foreground">{displayPrice}€</span>
            <span className="text-muted-foreground text-sm">/mois</span>
            {billing === 'annual' && (
              <p className="text-xs text-primary font-medium mt-0.5">
                Facturé {displayPrice * 12}€/an
              </p>
            )}
          </div>
          <Button asChild size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-semibold px-8">
            <Link href={`/dashboard/settings?tab=billing`}>
              Passer au plan {nextPlanName}
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
