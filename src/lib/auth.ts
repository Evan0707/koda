import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema/core'
import { User } from '@/types/db'
import { eq } from 'drizzle-orm'
import { hasPermission, type Permission, type Role } from '@/lib/permissions'

export async function getUser(): Promise<User | null> {
 const supabase = await createClient()
 const { data: { user: authUser } } = await supabase.auth.getUser()

 if (!authUser) return null

 // Get full user profile from database
 const user = await db.query.users.findFirst({
  where: eq(users.id, authUser.id),
  with: {
   organization: true
  }
 })

 return (user as User) || null
}

export async function getOrganizationId(): Promise<string> {
 const user = await getUser()

 if (!user) throw new Error('Non authentifié')
 if (!user.organizationId) throw new Error('Aucune organisation liée')

 return user.organizationId
}

/**
 * Vérifie que l'utilisateur est authentifié ET possède la permission requise.
 * Retourne l'utilisateur si OK, sinon retourne une erreur.
 */
export async function requirePermission(permission: Permission): Promise<{ user: User } | { error: string }> {
 const user = await getUser()

 if (!user) return { error: 'Non authentifié' }
 if (!user.organizationId) return { error: 'Aucune organisation liée' }

 const role = (user.role || 'member') as Role

 if (!hasPermission(role, permission)) {
  return { error: 'Vous n\'avez pas les droits nécessaires pour cette action' }
 }

 return { user }
}

