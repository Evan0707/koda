'use server'

import { db, schema } from '@/db'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export type AuditAction = typeof schema.AUDIT_ACTIONS[keyof typeof schema.AUDIT_ACTIONS]

interface LogAuditParams {
 action: AuditAction | string
 entityType: string
 entityId?: string
 metadata?: Record<string, any>
}

/**
 * Log an audit event
 * Call this after important actions (create, update, delete, send, etc.)
 */
export async function logAudit(params: LogAuditParams) {
 try {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   console.warn('Audit log skipped: no authenticated user')
   return
  }

  // Get user's organization
  const dbUser = await db.query.users.findFirst({
   where: (users, { eq }) => eq(users.id, user.id),
   columns: { organizationId: true }
  })

  // Get request headers for IP and user agent
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0]
   || headersList.get('x-real-ip')
   || null
  const userAgent = headersList.get('user-agent') || null

  await db.insert(schema.auditLogs).values({
   organizationId: dbUser?.organizationId || null,
   userId: user.id,
   action: params.action,
   entityType: params.entityType,
   entityId: params.entityId || null,
   metadata: params.metadata || {},
   ipAddress,
   userAgent,
  })

 } catch (error) {
  // Don't throw - audit logging should never break the main flow
  console.error('Failed to log audit event:', error)
 }
}

/**
 * Get audit logs for the current user's organization
 */
export async function getAuditLogs(options?: {
 entityType?: string
 limit?: number
 offset?: number
}) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
  return { error: 'Non authentifié', logs: [] }
 }

 const dbUser = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, user.id),
  columns: { organizationId: true }
 })

 if (!dbUser?.organizationId) {
  return { logs: [] }
 }

 const limit = options?.limit || 50
 const offset = options?.offset || 0

 const logs = await db.query.auditLogs.findMany({
  where: (auditLogs, { eq, and }) => {
   const conditions = [eq(auditLogs.organizationId, dbUser.organizationId!)]
   if (options?.entityType) {
    conditions.push(eq(auditLogs.entityType, options.entityType))
   }
   return and(...conditions)
  },
  with: {
   user: {
    columns: {
     id: true,
     firstName: true,
     lastName: true,
     email: true,
    }
   }
  },
  orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
  limit,
  offset,
 })

 return { logs }
}
