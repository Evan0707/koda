
import { getSubscriptionStatus } from '@/lib/actions/subscriptions'
import UpgradeClient from './upgrade-client'
import { redirect } from 'next/navigation'

export default async function UpgradePage() {
  const status = await getSubscriptionStatus()

  if ('error' in status) {
    // If error (e.g. not auth), redirect to login or show error
    // For now, if organization not found or other error, standard behavior
    // might be to redirect to dashboard or login
    if (status.error === 'Non authentifié') {
      redirect('/login')
    }
    // For other errors, we might default to free or show error page.
    // Let's assume free for now to allow access to page, or we could render error.
  }

  const currentPlan = 'error' in status ? 'free' : (status.plan as 'free' | 'starter' | 'pro')

  return <UpgradeClient currentPlan={currentPlan} />
}
