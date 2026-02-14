'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendMailjetEmail } from '@/lib/mailjet'
import { getPasswordResetTemplate, getConfirmationTemplate } from '@/lib/email-templates'
import { signUpSchema, resetPasswordSchema, updatePasswordSchema, validateInput } from '@/lib/validations'
import { isRateLimited, getRateLimitKey, rateLimiters } from '@/lib/rate-limit'
import { getAppUrl } from '@/lib/utils'

export async function signUpAction(formData: FormData) {
 // Rate limiting
 const rateLimitKey = await getRateLimitKey('signup')
 if (await isRateLimited(rateLimitKey, rateLimiters.auth)) {
  return { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
 }

 const email = formData.get('email') as string
 const password = formData.get('password') as string
 const confirmPassword = formData.get('confirmPassword') as string

 // Validate input with Zod
 const validation = validateInput(signUpSchema, { email, password, confirmPassword })
 if (!validation.success) {
  return { error: validation.error }
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
   redirectTo: `${getAppUrl()}/auth/callback`
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
 // Rate limiting
 const rateLimitKey = await getRateLimitKey('reset-password')
 if (await isRateLimited(rateLimitKey, rateLimiters.passwordReset)) {
  return { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
 }

 const email = formData.get('email') as string

 // Validate input
 const validation = validateInput(resetPasswordSchema, { email })
 if (!validation.success) {
  return { error: validation.error }
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
   redirectTo: `${getAppUrl()}/update-password`,
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

 // Validate input with Zod
 const validation = validateInput(updatePasswordSchema, { password, confirmPassword })
 if (!validation.success) {
  return { error: validation.error }
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
