import { getUserProfile } from '@/lib/actions/settings'
import SettingsClient from './settings-client'
import { getGmailStatus } from '@/lib/actions/email'
import { getSubscriptionStatus } from '@/lib/actions/subscriptions'

export default async function SettingsPage() {
 const result = await getUserProfile()
 const gmailStatus = await getGmailStatus()
 const subscriptionStatus = await getSubscriptionStatus()

 // Merge gmail status into profile
 const profile = 'error' in result ? null : {
  ...result.profile,
  role: result.profile.role as 'owner' | 'admin' | 'member',
  gmailEmail: gmailStatus.email,
  gmailConnectedAt: gmailStatus.connectedAt,
 }

 return (
  <SettingsClient
   profile={profile}
   subscriptionStatus={'error' in subscriptionStatus ? {
    plan: 'free',
    planStatus: 'active',
    stripeSubscriptionId: null,
    commissionRate: null,
    monthlyInvoiceCount: 0,
    cancelAtPeriodEnd: false
   } : {
    ...subscriptionStatus,
    plan: subscriptionStatus.plan as 'free' | 'starter' | 'pro'
   }}
  />
 )
}
