'use server'
import { db } from '@/db'
import { users } from '@/db/schema/core'
import { getOrganizationId } from '@/lib/auth'
import { eq, and, isNull } from 'drizzle-orm'

export async function getUsers() {
 try {
  const organizationId = await getOrganizationId()

  const data = await db.query.users.findMany({
   where: and(
    eq(users.organizationId, organizationId),
    isNull(users.deletedAt)
   ),
   columns: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    avatarUrl: true,
   }
  })

  return { users: data }
 } catch (error) {
  console.error('Error fetching users:', error)
  return { error: 'Erreur lors de la récupération des utilisateurs' }
 }
}
