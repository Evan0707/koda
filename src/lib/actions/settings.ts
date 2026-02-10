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
      // Stripe
      stripePublishableKey: dbUser?.organization?.stripePublishableKey || null,
      stripeSecretKey: dbUser?.organization?.stripeSecretKey || null,
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

// Update company info (organization)
export async function updateCompanyInfo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

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

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    return { error: 'Mot de passe actuel incorrect' }
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

// Update Stripe settings
export async function updateStripeSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

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
  if (stripeSecretKey && !stripeSecretKey.startsWith('sk_')) {
    return { error: 'La clé secrète doit commencer par sk_' }
  }

  await db.update(schema.organizations)
    .set({
      stripePublishableKey,
      stripeSecretKey,
      updatedAt: new Date(),
    })
    .where(eq(schema.organizations.id, dbUser.organizationId))

  revalidatePath('/dashboard/settings')
  return { success: true }
}

// Upload avatar
export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  const file = formData.get('avatar') as File
  if (!file) {
    return { error: 'Aucun fichier fourni' }
  }

  // 1. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`

  // Note: 'avatars' bucket must exist and be public
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true
    })

  if (uploadError) {
    console.error('Upload error:', uploadError)
    return { error: 'Erreur lors de l\'upload' }
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // 3. Update User Profile
  await db.update(schema.users)
    .set({ avatarUrl: publicUrl, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard', 'layout') // Revalidate layout to update sidebar/header avatar
  return { success: true, url: publicUrl }
}

// Delete user account and all associated data
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non autorisé' }
  }

  try {
    // Get user's organization ID
    const dbUser = await db.query.users.findFirst({
      where: eq(schema.users.id, user.id),
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
    // Try to clean up known buckets for orphans
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

        // If we have orgId, search by orgId too (folders)
        if (dbUser?.organizationId) {
          const { data: orgFiles } = await serviceRoleSupabase.storage
            .from(bucket)
            .list(dbUser.organizationId) // Assuming folder structure or proper search

          if (orgFiles && orgFiles.length > 0) {
            // This might be risky if flat structure, but 'list(folder)' implies folder.
            // Verification needed if buckets use folders.
            // Safest is to rely on schema.files for org files, which we do below.
          }
        }
      } catch (e) {
        // Ignore bucket not found errors
      }
    }))

    if (dbUser?.organizationId) {
      // Delete organization data respecting foreign keys
      const orgId = dbUser.organizationId

      // Explicitly delete files recorded in DB (which might have different paths)
      const orgFiles = await db.query.files.findMany({
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

      // 1. Logs & History
      // Delete audit logs by OrgID AND UserID to be safe
      await db.delete(schema.auditLogs).where(
        or(
          eq(schema.auditLogs.organizationId, orgId),
          eq(schema.auditLogs.userId, user.id)
        )
      )
      await db.delete(schema.activityLogs).where(eq(schema.activityLogs.organizationId, orgId))
      await db.delete(schema.automationLogs).where(eq(schema.automationLogs.organizationId, orgId))

      // 2. Collaboration
      await db.delete(schema.notifications).where(
        or(
          eq(schema.notifications.organizationId, orgId),
          eq(schema.notifications.userId, user.id)
        )
      )
      await db.delete(schema.messages).where(
        eq(schema.messages.conversationId,
          db.select({ id: schema.conversations.id })
            .from(schema.conversations)
            .where(eq(schema.conversations.organizationId, orgId))
        )
      )
      await db.delete(schema.conversations).where(eq(schema.conversations.organizationId, orgId))

      // 3. Automation
      await db.delete(schema.automationRules).where(eq(schema.automationRules.organizationId, orgId))
      await db.delete(schema.aiSuggestions).where(eq(schema.aiSuggestions.organizationId, orgId))
      await db.delete(schema.webhooks).where(eq(schema.webhooks.organizationId, orgId))

      // 4. Time & Projects
      await db.delete(schema.timeEntries).where(
        or(
          eq(schema.timeEntries.organizationId, orgId),
          eq(schema.timeEntries.userId, user.id)
        )
      )
      await db.delete(schema.tasks).where(eq(schema.tasks.organizationId, orgId))
      // Delete client access tokens linked to projects
      await db.delete(schema.clientAccessTokens).where(eq(schema.clientAccessTokens.organizationId, orgId))
      await db.delete(schema.projects).where(eq(schema.projects.organizationId, orgId))

      // 5. Finance (Invoices -> Items)
      const invoices = await db.query.invoices.findMany({
        where: eq(schema.invoices.organizationId, orgId),
        columns: { id: true }
      })
      for (const invoice of invoices) {
        await db.delete(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, invoice.id))
        await db.delete(schema.payments).where(eq(schema.payments.invoiceId, invoice.id))
      }
      await db.delete(schema.invoices).where(eq(schema.invoices.organizationId, orgId))
      // Also delete orphan payments
      await db.delete(schema.payments).where(eq(schema.payments.organizationId, orgId))

      // 6. Sales (Quotes -> Items)
      const quotes = await db.query.quotes.findMany({
        where: eq(schema.quotes.organizationId, orgId),
        columns: { id: true }
      })
      for (const quote of quotes) {
        await db.delete(schema.quoteItems).where(eq(schema.quoteItems.quoteId, quote.id))
      }
      await db.delete(schema.quotes).where(eq(schema.quotes.organizationId, orgId))

      // 7. Pipeline & Opportunities
      // Delete activities first
      await db.delete(schema.activities).where(
        or(
          eq(schema.activities.organizationId, orgId),
          eq(schema.activities.createdBy, user.id)
        )
      )
      await db.delete(schema.opportunities).where(eq(schema.opportunities.organizationId, orgId))
      await db.delete(schema.pipelineStages).where(eq(schema.pipelineStages.organizationId, orgId))

      // 8. Legal
      await db.delete(schema.contracts).where(eq(schema.contracts.organizationId, orgId))
      await db.delete(schema.contractTemplates).where(eq(schema.contractTemplates.organizationId, orgId))
      await db.delete(schema.documentSequences).where(eq(schema.documentSequences.organizationId, orgId))

      // Finance Categories & Accounts
      await db.delete(schema.expenses).where(eq(schema.expenses.organizationId, orgId))
      await db.delete(schema.expenseCategories).where(eq(schema.expenseCategories.organizationId, orgId))
      await db.delete(schema.bankAccounts).where(eq(schema.bankAccounts.organizationId, orgId))

      // 9. Files
      await db.delete(schema.files).where(eq(schema.files.organizationId, orgId))

      // 10. Contacts & CRM
      await db.delete(schema.contacts).where(eq(schema.contacts.organizationId, orgId))
      await db.delete(schema.companies).where(eq(schema.companies.organizationId, orgId))

      // 11. Products & Settings & Tags
      await db.delete(schema.products).where(eq(schema.products.organizationId, orgId))
      await db.delete(schema.emailConfigs).where(eq(schema.emailConfigs.organizationId, orgId))
      await db.delete(schema.apiKeys).where(eq(schema.apiKeys.organizationId, orgId))
      await db.delete(schema.taggables).where(
        // Delete taggables where tag is in org
        inArray(
          schema.taggables.tagId,
          db.select({ id: schema.tags.id }).from(schema.tags).where(eq(schema.tags.organizationId, orgId))
        )
      )
      await db.delete(schema.tags).where(eq(schema.tags.organizationId, orgId))

      // 12. User & Org
      await db.delete(schema.users).where(eq(schema.users.id, user.id))
      await db.delete(schema.organizations).where(eq(schema.organizations.id, orgId))
    } else {
      // No organization, just user and their logs
      await db.delete(schema.auditLogs).where(eq(schema.auditLogs.userId, user.id))
      await db.delete(schema.notifications).where(eq(schema.notifications.userId, user.id))
      // Add other user-centric tables if any
      await db.delete(schema.users).where(eq(schema.users.id, user.id))
    }

    const { error: deleteError } = await serviceRoleSupabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Auth delete error:', deleteError)
      // Throwing error here to alert user, but only after best-effort cleanup
      throw deleteError
    }

    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { error: 'Erreur lors de la suppression du compte' }
  }
}
