import { getAuditLogs } from '@/lib/audit'
import { AuditLogsClient } from './audit-logs-client'

export const metadata = {
 title: 'Audit Logs | KodaFlow',
 description: 'Historique des actions',
}

export default async function AuditLogsPage() {
 const { logs } = await getAuditLogs({ limit: 100 })

 return <AuditLogsClient initialLogs={logs} />
}
