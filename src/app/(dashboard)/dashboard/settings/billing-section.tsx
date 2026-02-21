'use client'

import { Crown, Zap, Sparkles, ExternalLink, CreditCard, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanBadge } from '@/components/plan-badge'
import { PLAN_LIMITS, PLAN_PRICING } from '@/lib/utils/plan-limits'
import Link from 'next/link'
import { cancelSubscription, resumeSubscription, createCustomerPortalSession } from '@/lib/actions/subscriptions'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

type SubscriptionStatus = {
 plan: 'free' | 'starter' | 'pro'
 planStatus: string | null
 stripeSubscriptionId: string | null
 commissionRate: string | null
 monthlyInvoiceCount: number | null
 cancelAtPeriodEnd?: boolean
 subscriptionEndDate?: Date | null
 isTrialing?: boolean
 trialEnd?: Date | null
 billingPeriod?: 'monthly' | 'annual'
}

export default function BillingSection({ subscriptionStatus }: { subscriptionStatus: SubscriptionStatus }) {
 const router = useRouter()
 const [isPending, startTransition] = useTransition()

 const handleCancel = () => {
  startTransition(async () => {
   const result = await cancelSubscription()
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Abonnement annulé pour la fin de la période')
    router.refresh()
   }
  })
 }

 const handleResume = () => {
  startTransition(async () => {
   const result = await resumeSubscription()
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Abonnement réactivé avec succès !')
    router.refresh()
   }
  })
 }

 const handleOpenPortal = () => {
  startTransition(async () => {
   const result = await createCustomerPortalSession()
   if (result.error) {
    toast.error(result.error)
   } else if (result.url) {
    window.open(result.url, '_blank')
   }
  })
 }

 const planIcons = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
 }

 const planLabels = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
 }

 const planPrices = {
  free: '0€',
  starter: subscriptionStatus.billingPeriod === 'annual' ? `${PLAN_PRICING.starter.annual}€` : `${PLAN_PRICING.starter.monthly}€`,
  pro: subscriptionStatus.billingPeriod === 'annual' ? `${PLAN_PRICING.pro.annual}€` : `${PLAN_PRICING.pro.monthly}€`,
 }

 const billingLabel = subscriptionStatus.billingPeriod === 'annual' ? '/mois (annuel)' : '/mois'

 const Icon = planIcons[subscriptionStatus.plan]
 const isPastDue = subscriptionStatus.planStatus === 'past_due'
 const isTrialing = subscriptionStatus.isTrialing

 // Calculate trial days remaining
 const trialDaysRemaining = subscriptionStatus.trialEnd
  ? Math.max(0, Math.ceil((new Date(subscriptionStatus.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  : 0

 return (
  <div className="space-y-6">
   {/* Trial info banner */}
   {isTrialing && (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30">
     <CardContent className="flex items-start gap-3 pt-6">
      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div>
       <p className="font-semibold text-blue-800 dark:text-blue-300">
        Période d&apos;essai — {trialDaysRemaining} jour{trialDaysRemaining > 1 ? 's' : ''} restant{trialDaysRemaining > 1 ? 's' : ''}
       </p>
       <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
        Votre essai gratuit se termine le{' '}
        {subscriptionStatus.trialEnd
         ? new Date(subscriptionStatus.trialEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
         : '—'}.
        Ajoutez un moyen de paiement pour continuer après l&apos;essai.
       </p>
       <Button
        variant="outline"
        size="sm"
        className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
        onClick={handleOpenPortal}
        disabled={isPending}
       >
        <CreditCard className="w-4 h-4 mr-2" />
        Ajouter un moyen de paiement
       </Button>
      </div>
     </CardContent>
    </Card>
   )}

   {/* Past due warning */}
   {isPastDue && (
    <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30">
     <CardContent className="flex items-start gap-3 pt-6">
      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div>
       <p className="font-semibold text-red-800 dark:text-red-300">Paiement en retard</p>
       <p className="text-sm text-red-700 dark:text-red-400 mt-1">
        Le paiement de votre abonnement a échoué. Veuillez mettre à jour votre moyen de paiement
        pour éviter la suspension de votre compte.
       </p>
       <Button
        variant="destructive"
        size="sm"
        className="mt-3"
        onClick={handleOpenPortal}
        disabled={isPending}
       >
        <CreditCard className="w-4 h-4 mr-2" />
        Mettre à jour le moyen de paiement
       </Button>
      </div>
     </CardContent>
    </Card>
   )}

   <Card>
    <CardHeader>
     <CardTitle>Plan actuel</CardTitle>
     <CardDescription>Gérez votre abonnement et votre facturation</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
     {/* Plan info */}
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
       <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
       </div>
       <div>
        <div className="flex items-center gap-2">
         <span className="font-semibold text-lg">{planLabels[subscriptionStatus.plan]}</span>
         <PlanBadge plan={subscriptionStatus.plan} />
         {isTrialing && (
          <Badge variant="secondary" className="text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
           Essai gratuit
          </Badge>
         )}
         {subscriptionStatus.cancelAtPeriodEnd && (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
           Annulation planifiée
          </Badge>
         )}
         {isPastDue && (
          <Badge variant="destructive">Paiement en retard</Badge>
         )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
         {planPrices[subscriptionStatus.plan]}{billingLabel}
         {subscriptionStatus.plan === 'free' && ` • Commission: ${Number(subscriptionStatus.commissionRate || 0) * 100}%`}
         {subscriptionStatus.plan !== 'free' && ' • Commission: 0%'}
        </p>
       </div>
      </div>

      {subscriptionStatus.plan === 'free' ? (
       <Button asChild>
        <Link href="/dashboard/upgrade">
         Passer à un plan payant
        </Link>
       </Button>
      ) : (
       <div className="flex items-center gap-2">
        {subscriptionStatus.cancelAtPeriodEnd ? (
         <Button variant="outline" onClick={handleResume} disabled={isPending} className="border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800">
          {isPending ? 'Activation...' : 'Réactiver'}
         </Button>
        ) : (
         <AlertDialog>
          <AlertDialogTrigger asChild>
           <Button variant="ghost" size="sm" disabled={isPending} className="text-destructive hover:text-destructive">
            {isPending ? 'Annulation...' : 'Annuler'}
           </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
           <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-red-500" />
             Annuler votre abonnement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
             Votre abonnement prendra fin à la date d&apos;échéance. Vous conserverez vos avantages jusqu&apos;à cette date.
             Après cela, vous serez rétrogradé au plan Gratuit avec une commission de 5%.
            </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
             onClick={handleCancel}
             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
             Confirmer l&apos;annulation
            </AlertDialogAction>
           </AlertDialogFooter>
          </AlertDialogContent>
         </AlertDialog>
        )}
       </div>
      )}
     </div>

     {/* Subscription details */}
     {subscriptionStatus.plan !== 'free' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
       <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Statut</p>
        <p className="font-medium mt-1">
         {subscriptionStatus.cancelAtPeriodEnd ? '⏳ Annulation en cours' :
          isPastDue ? '⚠️ Paiement en retard' :
          isTrialing ? '🆓 Période d\'essai' :
          '✅ Actif'}
        </p>
       </div>
       {subscriptionStatus.subscriptionEndDate && (
        <div>
         <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {subscriptionStatus.cancelAtPeriodEnd ? 'Fin le' : 'Prochain renouvellement'}
         </p>
         <p className="font-medium mt-1">
          {new Date(subscriptionStatus.subscriptionEndDate).toLocaleDateString('fr-FR', {
           day: 'numeric', month: 'long', year: 'numeric'
          })}
         </p>
        </div>
       )}
      </div>
     )}

     {/* Free plan usage */}
     {subscriptionStatus.plan === 'free' && (
      <div className="p-4 bg-muted/50 rounded-lg">
       <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Factures ce mois</p>
        <p className="text-sm font-semibold">{subscriptionStatus.monthlyInvoiceCount || 0} / {PLAN_LIMITS.free.maxInvoicesPerMonth}</p>
       </div>
       <div className="w-full bg-muted rounded-full h-2">
        <div
         className="bg-primary rounded-full h-2 transition-all"
         style={{ width: `${Math.min(((subscriptionStatus.monthlyInvoiceCount || 0) / PLAN_LIMITS.free.maxInvoicesPerMonth) * 100, 100)}%` }}
        />
       </div>
       <p className="text-xs text-muted-foreground mt-2">
        Passez à un plan payant pour augmenter vos limites et supprimer la commission
       </p>
      </div>
     )}

     {/* Actions */}
     <div className="flex flex-wrap gap-3 pt-2 border-t">
      {subscriptionStatus.plan !== 'free' && subscriptionStatus.stripeSubscriptionId && (
       <Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={isPending}>
        <CreditCard className="w-4 h-4 mr-2" />
        Gérer le paiement
        <ExternalLink className="w-3 h-3 ml-2" />
       </Button>
      )}
      <Button asChild variant="outline" size="sm">
       <Link href="/dashboard/upgrade">
        {subscriptionStatus.plan === 'free' ? 'Voir les plans' : 'Changer de plan'}
       </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
       <Link href="/pricing">
        Comparer les offres
        <ExternalLink className="w-3 h-3 ml-2" />
       </Link>
      </Button>
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
