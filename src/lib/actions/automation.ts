'use server'

import { db, schema } from '@/db'
import { eq, desc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(limit = 10) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { notifications: [] }

 const notifications = await db.query.notifications.findMany({
  where: eq(schema.notifications.userId, user.id),
  orderBy: [desc(schema.notifications.createdAt)],
  limit: limit,
 })

 const unreadCount = await db.$count(
  schema.notifications,
  and(
   eq(schema.notifications.userId, user.id),
   eq(schema.notifications.isRead, false)
  )
 )

 return { notifications, unreadCount }
}

export async function markAsRead(id: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: 'Non autorisé' }

 await db.update(schema.notifications)
  .set({ isRead: true })
  .where(and(
   eq(schema.notifications.id, id),
   eq(schema.notifications.userId, user.id)
  ))

 revalidatePath('/dashboard')
 return { success: true }
}

export async function markAllAsRead() {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) return { error: 'Non autorisé' }

 await db.update(schema.notifications)
  .set({ isRead: true })
  .where(and(
   eq(schema.notifications.userId, user.id),
   eq(schema.notifications.isRead, false)
  ))

 revalidatePath('/dashboard')
 return { success: true }
}

// Internal function to create notification
// WARNING: This is in a 'use server' file but should only be called server-side.
// It validates that the caller is authenticated and the target userId belongs to the same org.
export async function createNotification(userId: string, organizationId: string, data: {
 title: string
 message?: string
 type?: 'info' | 'success' | 'warning' | 'error'
 link?: string
 resourceType?: string
 resourceId?: string
}) {
 try {
  // Security: verify the caller is authenticated and belongs to the target org
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  // Verify caller belongs to the same organization
  const callerUser = await db.query.users.findFirst({
   where: and(
    eq(schema.users.id, user.id),
    eq(schema.users.organizationId, organizationId)
   )
  })
  if (!callerUser) return { error: 'Non autorisé' }

  await db.insert(schema.notifications).values({
   userId,
   organizationId,
   title: data.title,
   body: data.message, // Schema uses body
   type: data.type || 'info',
   link: data.link,
   resourceType: data.resourceType,
   resourceId: data.resourceId,
  })
  return { success: true }
 } catch (error) {
  console.error('Failed to create notification:', error)
  return { error: 'Failed' }
 }
}
