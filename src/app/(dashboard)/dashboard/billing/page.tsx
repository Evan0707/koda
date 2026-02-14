import { getUserProfile } from '@/lib/actions/settings'
import BillingSection from '../settings/billing-section'
import { getSubscriptionStatus } from '@/lib/actions/subscriptions'
import { ErrorState } from '@/components/error-state'

export default async function BillingPage() {
 const result = await getUserProfile()
 const subscriptionResult = await getSubscriptionStatus()

 if ('error' in result) {
  return <ErrorState message="Erreur lors du chargement des données" />
 }

 const subscriptionStatus = 'error' in subscriptionResult ? null : subscriptionResult as any

 if (!subscriptionStatus) {
  return <ErrorState message="Erreur lors du chargement de l'abonnement" />
 }

 return (
  <div className="container max-w-4xl mx-auto py-8 px-4">
   <h1 className="text-3xl font-bold mb-6">Facturation & Abonnement</h1>
   <BillingSection subscriptionStatus={subscriptionStatus} />
  </div>
 )
}
