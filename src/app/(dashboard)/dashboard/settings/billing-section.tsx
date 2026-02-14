'use client'

import { Crown, Zap, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanBadge } from '@/components/plan-badge'
import Link from 'next/link'
import { cancelSubscription, resumeSubscription } from '@/lib/actions/subscriptions'
import { useState, useTransition } from 'react'
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
import { AlertTriangle } from 'lucide-react'

type SubscriptionStatus = {
 plan: 'free' | 'starter' | 'pro'
 planStatus: string | null
 stripeSubscriptionId: string | null
 commissionRate: string | null
 monthlyInvoiceCount: number | null
 cancelAtPeriodEnd?: boolean
 subscriptionEndDate?: Date | null
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

 const planIcons = {
  free: Sparkles,
  starter: Zap,
  pro: Crown,
 }

 const Icon = planIcons[subscriptionStatus.plan]

 return (
  <div className="space-y-6">
   <Card>
    <CardHeader>
     <CardTitle>Plan actuel</CardTitle>
     <CardDescription>Gérez votre abonnement et votre facturation</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
       <Icon className="w-5 h-5" />
       <div>
        <div className="flex items-center gap-2">
         <span className="font-semibold text-lg capitalize">{subscriptionStatus.plan}</span>
         <PlanBadge plan={subscriptionStatus.plan} />
         {subscriptionStatus.cancelAtPeriodEnd && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
           Fin le {new Date(subscriptionStatus.subscriptionEndDate!).toLocaleDateString()}
          </span>
         )}
        </div>
        <p className="text-sm text-muted-foreground">
         {subscriptionStatus.plan === 'free' && `Commission: ${Number(subscriptionStatus.commissionRate || 0) * 100}% par transaction`}
         {subscriptionStatus.plan === 'starter' && 'Commission: 0% | 100 factures/mois'}
         {subscriptionStatus.plan === 'pro' && 'Commission: 0% | Factures illimitées'}
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
       <>
        {subscriptionStatus.cancelAtPeriodEnd ? (
         <Button variant="outline" onClick={handleResume} disabled={isPending} className="border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800">
          {isPending ? 'Activation...' : 'Réactiver l\'abonnement'}
         </Button>
        ) : (
         <AlertDialog>
          <AlertDialogTrigger asChild>
           <Button variant="outline" disabled={isPending} className="text-destructive hover:text-destructive">
            {isPending ? 'Annulation...' : 'Annuler l\'abonnement'}
           </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
           <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
             <AlertTriangle className="w-5 h-5 text-red-500" />
             Annuler votre abonnement ?
            </AlertDialogTitle>
            <AlertDialogDescription>
             Votre abonnement prendra fin à la date d'échéance. Vous conserverez vos avantages jusqu'à cette date.
            </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction
             onClick={handleCancel}
             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
             Confirmer l'annulation
            </AlertDialogAction>
           </AlertDialogFooter>
          </AlertDialogContent>
         </AlertDialog>
        )}
       </>
      )}
     </div>

     {subscriptionStatus.plan === 'free' && (
      <div className="bg-muted p-4 rounded-lg">
       <p className="text-sm">
        <strong>Factures ce mois:</strong> {subscriptionStatus.monthlyInvoiceCount || 0} / 10
       </p>
       <p className="text-xs text-muted-foreground mt-1">
        Passez à un plan payant pour augmenter vos limites et supprimer la commission
       </p>
      </div>
     )}
    </CardContent>
   </Card>

   <Card>
    <CardHeader>
     <CardTitle>Plans disponibles</CardTitle>
     <CardDescription>Comparez nos offres</CardDescription>
    </CardHeader>
    <CardContent>
     <Button asChild variant="outline" className="w-full">
      <Link href="/pricing">
       Voir tous les plans
      </Link>
     </Button>
    </CardContent>
   </Card>
  </div>
 )
}
