'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { organizations, users } from '@/db/schema/core'

export async function completeOnboarding(formData: FormData) {
 const supabase = await createClient()

 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
  return { error: 'Non authentifié' }
 }

 const organizationName = formData.get('organizationName') as string
 const firstName = formData.get('firstName') as string
 const lastName = formData.get('lastName') as string
 const activity = formData.get('activity') as string

 if (!organizationName || !firstName) {
  return { error: 'Veuillez remplir tous les champs obligatoires' }
 }

 try {
  // Create organization
  const slug = organizationName
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/(^-|-$)/g, '')
   + '-' + Date.now().toString(36)

  const [org] = await db.insert(organizations).values({
   name: organizationName,
   slug,
   preferences: { activity },
  }).returning()

  // Create user profile
  await db.insert(users).values({
   id: user.id,
   organizationId: org.id,
   email: user.email!,
   firstName,
   lastName,
   role: 'owner',
  })

  // Create default pipeline stages
  // This will be done in a separate function or migration

 } catch (error) {
  console.error('Onboarding error:', error)
  return { error: 'Une erreur est survenue lors de la création de votre compte' }
 }

 redirect('/dashboard')
}
