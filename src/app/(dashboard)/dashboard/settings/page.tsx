import { getUserProfile } from '@/lib/actions/settings'
import SettingsClient from './settings-client'
import { getGmailStatus } from '@/lib/actions/email'

export default async function SettingsPage() {
 const result = await getUserProfile()
 const gmailStatus = await getGmailStatus()

 // Merge gmail status into profile
 const profile = 'error' in result ? null : {
  ...result.profile,
  gmailEmail: gmailStatus.email,
  gmailConnectedAt: gmailStatus.connectedAt,
 }

 return (
  <SettingsClient
   profile={profile}
  />
 )
}
