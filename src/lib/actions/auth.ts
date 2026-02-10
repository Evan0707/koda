'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendMailjetEmail } from '@/lib/mailjet'
import { getPasswordResetTemplate, getConfirmationTemplate } from '@/lib/email-templates'

export async function signUpAction(formData: FormData) {
 const email = formData.get('email') as string
 const password = formData.get('password') as string
 const confirmPassword = formData.get('confirmPassword') as string

 if (!email || !password || !confirmPassword) {
  return { error: 'Veuillez remplir tous les champs' }
 }

 if (password !== confirmPassword) {
  return { error: 'Les mots de passe ne correspondent pas' }
 }

 if (password.length < 6) {
  return { error: 'Le mot de passe doit contenir au moins 6 caractères' }
 }

 // Use Service Role for admin actions
 const serviceRoleSupabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
   cookies: {
    getAll() { return [] },
    setAll() { }
   }
  }
 )

 // 1. Check if user already exists (optional, createUser handles it but we want custom error)
 // Actually admin.createUser returns error if exists

 // 2. Create User
 const { data: user, error: createError } = await serviceRoleSupabase.auth.admin.createUser({
  email,
  password,
  email_confirm: false, // Require confirmation
  user_metadata: {
   full_name: email.split('@')[0] // Default name
  }
 })

 if (createError) {
  console.error('Signup error:', createError)
  return { error: createError.message || 'Impossible de créer le compte' }
 }

 if (!user.user) {
  console.error('User creation failed: No user returned')
  return { error: 'Erreur lors de la création du compte' }
 }

 // 3. Generate Link
 const { data: linkData, error: linkError } = await serviceRoleSupabase.auth.admin.generateLink({
  type: 'signup',
  email,
  password,
  options: {
   redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  }
 })

 if (linkError || !linkData.properties?.action_link) {
  console.error('Link generation error:', linkError)
  // Fallback: User is created but no link sent. They can request resend.
  return { error: 'Compte créé mais impossible de générer le lien de confirmation' }
 }

 const confirmationLink = linkData.properties.action_link

 // 4. Send Email via Mailjet
 const emailResult = await sendMailjetEmail({
  to: email,
  subject: 'Confirmez votre inscription KodaFlow',
  htmlBody: getConfirmationTemplate(confirmationLink)
 })

 if (!emailResult?.success) {
  console.error('Mailjet error:', emailResult)
  return { error: 'Compte créé mais impossible d\'envoyer l\'email de confirmation' }
 }

 return { success: 'Compte créé avec succès ! Vérifiez vos emails.' }
}

export async function resetPasswordForEmail(formData: FormData) {
 const email = formData.get('email') as string
 const supabase = await createClient()

 if (!email) {
  return { error: 'Email requis' }
 }

 // Use Service Role to generate link
 const serviceRoleSupabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
   cookies: {
    getAll() { return [] },
    setAll() { }
   }
  }
 )

 const { data, error } = await serviceRoleSupabase.auth.admin.generateLink({
  type: 'recovery',
  email,
  options: {
   redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
  }
 })

 if (error) {
  console.error('Reset password error:', error)
  return { error: 'Impossible de générer le lien de réinitialisation' }
 }

 // Send email via Mailjet
 const { properties } = data
 const resetLink = properties.action_link

 const emailResult = await sendMailjetEmail({
  to: email,
  subject: 'Réinitialisation de votre mot de passe',
  htmlBody: getPasswordResetTemplate(resetLink)
 })

 if (!emailResult.success) {
  return { error: 'Impossible d\'envoyer l\'email' }
 }

 return { success: 'Email de réinitialisation envoyé' }
}

export async function updatePassword(formData: FormData) {
 const password = formData.get('password') as string
 const confirmPassword = formData.get('confirmPassword') as string
 const supabase = await createClient()

 if (!password || !confirmPassword) {
  return { error: 'Veuillez remplir tous les champs' }
 }

 if (password !== confirmPassword) {
  return { error: 'Les mots de passe ne correspondent pas' }
 }

 const { error } = await supabase.auth.updateUser({
  password: password,
 })

 if (error) {
  console.error('Update password error:', error)
  return { error: 'Impossible de mettre à jour le mot de passe' }
 }

 revalidatePath('/dashboard')
 redirect('/dashboard')
}
