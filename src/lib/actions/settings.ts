'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { db, schema } from '@/db'
import { eq, or, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get current user profile
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
    with: {
      organization: true,
    },
  })

  // Return combined profile
  return {
    profile: {
      id: user.id,
      email: user.email || null,
      firstName: dbUser?.firstName || null,
      lastName: dbUser?.lastName || null,
      phone: dbUser?.phone || null,
      avatarUrl: dbUser?.avatarUrl || null,
      // Company info from organization
      companyName: dbUser?.organization?.name || null,
      companyAddress: dbUser?.organization?.address || null,
      companyCity: dbUser?.organization?.city || null,
      companyCountry: dbUser?.organization?.country || null,
      companySiret: dbUser?.organization?.siret || null,
      companyVat: dbUser?.organization?.vatNumber || null,
      // Preferences
      defaultVatRate: 20,
      currency: dbUser?.organization?.defaultCurrency || 'EUR',
      quotePrefix: 'DEV-',
      invoicePrefix: 'FAC-',
      paymentTerms: 30,
      // Stripe (mask secret key — never expose full value to client)
      stripePublishableKey: dbUser?.organization?.stripePublishableKey || null,
      stripeSecretKey: dbUser?.organization?.stripeSecretKey
        ? `${dbUser.organization.stripeSecretKey.slice(0, 7)}...${dbUser.organization.stripeSecretKey.slice(-4)}`
        : null,
      role: dbUser?.role || 'member',
    }
  }
}

// Update user profile
export async function updateUserProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const data = {
    firstName: formData.get('firstName') as string || null,
    lastName: formData.get('lastName') as string || null,
    phone: formData.get('phone') as string || null,
    updatedAt: new Date(),
  }

  // Check if user exists in db
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (existingUser) {
    // Update
    await db.update(schema.users)
      .set(data)
      .where(eq(schema.users.id, user.id))
  } else {
    // Insert
    await db.insert(schema.users).values({
      id: user.id,
      email: user.email!,
      ...data,
    })
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

import { requirePermission } from '@/lib/auth'
import { isRateLimited, getRateLimitKey, rateLimiters } from '@/lib/rate-limit'

// Update company info (organization)
export async function updateCompanyInfo(formData: FormData) {
  const auth = await requirePermission('manage_company')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  // Get user's organization
  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  const orgData = {
    name: formData.get('companyName') as string || 'Mon Entreprise',
    address: formData.get('companyAddress') as string || null,
    city: formData.get('companyCity') as string || null,
    country: formData.get('companyCountry') as string || 'FR',
    siret: formData.get('companySiret') as string || null,
    vatNumber: formData.get('companyVat') as string || null,
    updatedAt: new Date(),
  }

  if (dbUser?.organizationId) {
    // Update existing organization
    await db.update(schema.organizations)
      .set(orgData)
      .where(eq(schema.organizations.id, dbUser.organizationId))
  } else {
    // Create new organization and link to user
    const slug = (orgData.name).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now()

    const [newOrg] = await db.insert(schema.organizations)
      .values({
        ...orgData,
        slug,
      })
      .returning()

    // Link user to organization
    await db.update(schema.users)
      .set({ organizationId: newOrg.id, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id))
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Update billing preferences (stored in organization preferences)
export async function updateBillingPreferences(formData: FormData) {
  const auth = await requirePermission('manage_billing')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  // Get user's organization
  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
    with: { organization: true },
  })

  if (!dbUser?.organizationId) {
    return { error: 'Veuillez d\'abord configurer votre entreprise' }
  }

  const preferences = {
    defaultVatRate: Number(formData.get('defaultVatRate')) || 20,
    quotePrefix: formData.get('quotePrefix') as string || 'DEV-',
    invoicePrefix: formData.get('invoicePrefix') as string || 'FAC-',
    paymentTerms: Number(formData.get('paymentTerms')) || 30,
  }

  await db.update(schema.organizations)
    .set({
      defaultCurrency: formData.get('currency') as string || 'EUR',
      preferences: {
        ...(dbUser.organization?.preferences as object || {}),
        ...preferences,
      },
      updatedAt: new Date(),
    })
    .where(eq(schema.organizations.id, dbUser.organizationId))

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Update Stripe settings
export async function updateStripeSettings(formData: FormData) {
  const auth = await requirePermission('manage_stripe')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  // Get user's organization
  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!dbUser?.organizationId) {
    return { error: 'Veuillez d\'abord configurer votre entreprise' }
  }

  const stripePublishableKey = formData.get('stripePublishableKey') as string || null
  const stripeSecretKey = formData.get('stripeSecretKey') as string || null

  // Basic validation
  if (stripePublishableKey && !stripePublishableKey.startsWith('pk_')) {
    return { error: 'La clé publique doit commencer par pk_' }
  }

  // Only validate/update secret key if a new value starting with sk_ was provided
  // This prevents re-encrypting masked values or clearing existing keys
  const hasNewSecretKey = stripeSecretKey && stripeSecretKey.startsWith('sk_')
  if (stripeSecretKey && !hasNewSecretKey) {
    // User entered something but it's not a valid key — ignore silently
    // (could be the masked placeholder value)
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    stripePublishableKey,
    updatedAt: new Date(),
  }

  // Only update secret key if user provided a new valid key
  if (hasNewSecretKey) {
    const { safeEncrypt } = await import('@/lib/encryption')
    updateData.stripeSecretKey = safeEncrypt(stripeSecretKey)
  }

  await db.update(schema.organizations)
    .set(updateData)
    .where(eq(schema.organizations.id, dbUser.organizationId))

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
  // Rate limit password changes
  const rateLimitKey = await getRateLimitKey('change-password')
  if (await isRateLimited(rateLimitKey, rateLimiters.auth)) {
    return { error: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non autorisé' }

  // Verify current password by trying to sign in (or re-authenticate)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  // If signIn fails, it might be due to incorrect password OR rate limits.
  // But generally, for password change, we want to verify it.
  if (signInError) {
    return { error: 'Mot de passe actuel incorrect' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Upload avatar
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non autorisé' }

  const file = formData.get('avatar') as File
  if (!file) return { error: 'Aucun fichier' }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP.' }
  }

  // Validate file size (max 2MB)
  const MAX_SIZE = 2 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { error: 'Fichier trop volumineux. Maximum 2 Mo.' }
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    return { error: 'Erreur lors de l\'upload' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update user profile
  await db.update(schema.users)
    .set({ avatarUrl: publicUrl })
    .where(eq(schema.users.id, user.id))

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Delete user account and all associated data
export async function deleteAccount() {
  const auth = await requirePermission('delete_account')
  if ('error' in auth) return { error: auth.error }

  const { user } = auth

  try {
    // Get user's organization
    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
      with: { organization: true },
    })

    // Deleting the auth user requires Service Role
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

    // 0. CLEANUP STORAGE FILES
    const bucketsToClean = ['avatars', 'files', 'documents', 'contracts']

    await Promise.all(bucketsToClean.map(async (bucket) => {
      try {
        // Search by user ID
        const { data: userFiles } = await serviceRoleSupabase.storage
          .from(bucket)
          .list('', { search: user.id })

        if (userFiles && userFiles.length > 0) {
          await serviceRoleSupabase.storage
            .from(bucket)
            .remove(userFiles.map(f => f.name))
        }

        // Search by Organization ID if available
        if (dbUser?.organizationId) {
          const { data: orgFiles } = await serviceRoleSupabase.storage
            .from(bucket)
            .list(dbUser.organizationId)

          if (orgFiles && orgFiles.length > 0) {
            // For now we assume if we list the folder we might want to delete contents
            // But 'remove' expects file paths. 
            // Ideally we iterate and delete. 
            // Given complexity, we will skip deep org folder cleanup here and rely on file table loop below
            // which is safer as it targets specific paths.
          }
        }
      } catch (e) {
        // Ignore bucket not found errors
      }
    }))

    if (dbUser?.organizationId) {
      const orgId = dbUser.organizationId

      // Wrap all DB deletions in a transaction for atomicity
      await db.transaction(async (tx) => {
        // 1. Files from DB
        const orgFiles = await tx.query.files.findMany({
          where: eq(schema.files.organizationId, orgId)
        })

        for (const file of orgFiles) {
          if (file.url) {
            try {
              const match = file.url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
              if (match) {
                const bucket = match[1]
                const path = decodeURIComponent(match[2])
                await serviceRoleSupabase.storage.from(bucket).remove([path])
              }
            } catch (e) {
              console.error('Error deleting file from storage:', e)
            }
          }
        }

        // 2. Database Cleanup (order matters — children first)

        // Logs
        await tx.delete(schema.auditLogs).where(
          or(
            eq(schema.auditLogs.organizationId, orgId),
            eq(schema.auditLogs.userId, user.id)
          )
        )
        await tx.delete(schema.activityLogs).where(eq(schema.activityLogs.organizationId, orgId))
        await tx.delete(schema.automationLogs).where(eq(schema.automationLogs.organizationId, orgId))

        // Collaboration
        await tx.delete(schema.notifications).where(
          or(
            eq(schema.notifications.organizationId, orgId),
            eq(schema.notifications.userId, user.id)
          )
        )
        await tx.delete(schema.messages).where(
          eq(schema.messages.conversationId,
            tx.select({ id: schema.conversations.id })
              .from(schema.conversations)
              .where(eq(schema.conversations.organizationId, orgId))
          )
        )
        await tx.delete(schema.conversations).where(eq(schema.conversations.organizationId, orgId))

        // Automation
        await tx.delete(schema.automationRules).where(eq(schema.automationRules.organizationId, orgId))
        await tx.delete(schema.aiSuggestions).where(eq(schema.aiSuggestions.organizationId, orgId))
        await tx.delete(schema.webhooks).where(eq(schema.webhooks.organizationId, orgId))

        // Time & Projects
        await tx.delete(schema.timeEntries).where(
          or(
            eq(schema.timeEntries.organizationId, orgId),
            eq(schema.timeEntries.userId, user.id)
          )
        )
        await tx.delete(schema.tasks).where(eq(schema.tasks.organizationId, orgId))
        await tx.delete(schema.cycles).where(eq(schema.cycles.organizationId, orgId))
        await tx.delete(schema.clientAccessTokens).where(eq(schema.clientAccessTokens.organizationId, orgId))
        await tx.delete(schema.projects).where(eq(schema.projects.organizationId, orgId))

        // Finance
        const invoiceList = await tx.query.invoices.findMany({
          where: eq(schema.invoices.organizationId, orgId),
          columns: { id: true }
        })
        for (const invoice of invoiceList) {
          await tx.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoice.id))
          await tx.delete(schema.payments).where(eq(schema.payments.invoiceId, invoice.id))
        }
        await tx.delete(schema.invoices).where(eq(schema.invoices.organizationId, orgId))
        await tx.delete(schema.payments).where(eq(schema.payments.organizationId, orgId))

        // Sales
        const quoteList = await tx.query.quotes.findMany({
          where: eq(schema.quotes.organizationId, orgId),
          columns: { id: true }
        })
        for (const quote of quoteList) {
          await tx.delete(schema.quoteItems).where(eq(schema.quoteItems.quoteId, quote.id))
        }
        await tx.delete(schema.quotes).where(eq(schema.quotes.organizationId, orgId))

        // Pipeline
        await tx.delete(schema.activities).where(
          or(
            eq(schema.activities.organizationId, orgId),
            eq(schema.activities.createdBy, user.id)
          )
        )
        await tx.delete(schema.opportunities).where(eq(schema.opportunities.organizationId, orgId))
        await tx.delete(schema.pipelineStages).where(eq(schema.pipelineStages.organizationId, orgId))

        // Legal
        await tx.delete(schema.contracts).where(eq(schema.contracts.organizationId, orgId))
        await tx.delete(schema.contractTemplates).where(eq(schema.contractTemplates.organizationId, orgId))
        await tx.delete(schema.documentSequences).where(eq(schema.documentSequences.organizationId, orgId))

        // Finance Categories & Accounts
        await tx.delete(schema.expenses).where(eq(schema.expenses.organizationId, orgId))
        await tx.delete(schema.expenseCategories).where(eq(schema.expenseCategories.organizationId, orgId))
        await tx.delete(schema.bankAccounts).where(eq(schema.bankAccounts.organizationId, orgId))

        // Files
        await tx.delete(schema.files).where(eq(schema.files.organizationId, orgId))

        // Contacts & CRM
        await tx.delete(schema.contacts).where(eq(schema.contacts.organizationId, orgId))
        await tx.delete(schema.companies).where(eq(schema.companies.organizationId, orgId))

        // Products & Settings & Tags
        await tx.delete(schema.products).where(eq(schema.products.organizationId, orgId))
        await tx.delete(schema.emailConfigs).where(eq(schema.emailConfigs.organizationId, orgId))
        await tx.delete(schema.apiKeys).where(eq(schema.apiKeys.organizationId, orgId))
        await tx.delete(schema.taggables).where(
          inArray(
            schema.taggables.tagId,
            tx.select({ id: schema.tags.id }).from(schema.tags).where(eq(schema.tags.organizationId, orgId))
          )
        )
        await tx.delete(schema.tags).where(eq(schema.tags.organizationId, orgId))

        // Subscriptions
        await tx.delete(schema.subscriptions).where(eq(schema.subscriptions.organizationId, orgId))

        // User & Org
        await tx.delete(schema.users).where(eq(schema.users.id, user.id))
        await tx.delete(schema.organizations).where(eq(schema.organizations.id, orgId))
      })
    } else {
      await db.transaction(async (tx) => {
        await tx.delete(schema.auditLogs).where(eq(schema.auditLogs.userId, user.id))
        await tx.delete(schema.notifications).where(eq(schema.notifications.userId, user.id))
        await tx.delete(schema.users).where(eq(schema.users.id, user.id))
      })
    }

    const { error: deleteError } = await serviceRoleSupabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Auth delete error:', deleteError)
      throw deleteError
    }

    const supabase = await createClient()
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { error: 'Erreur lors de la suppression du compte' }
  }
}
