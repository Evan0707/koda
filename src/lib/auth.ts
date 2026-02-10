import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { users } from '@/db/schema/core'
import { User } from '@/types/db'
import { eq } from 'drizzle-orm'

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
