'use server'

import { db, schema } from '@/db'
import { eq, desc, and, isNull, like, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ============================================
// CONTRACT TEMPLATES
// ============================================

export async function getContractTemplates(search?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!dbUser?.organizationId) return { templates: [] }

  let query = db.query.contractTemplates.findMany({
    where: and(
      eq(schema.contractTemplates.organizationId, dbUser.organizationId),
    ),
    orderBy: [desc(schema.contractTemplates.updatedAt)],
  })

  const templates = await query

  // Filter by search if provided
  const filtered = search
    ? templates.filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
    )
    : templates

  return { templates: filtered }
}

export async function getContractTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const template = await db.query.contractTemplates.findFirst({
    where: eq(schema.contractTemplates.id, id),
  })

  return { template }
}

export async function createContractTemplate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!dbUser?.organizationId) return { error: 'Organisation non trouvée' }

  const data = {
    organizationId: dbUser.organizationId,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    content: formData.get('content') as string,
    category: formData.get('category') as string || 'custom',
  }

  const [template] = await db.insert(schema.contractTemplates)
    .values(data)
    .returning()

  revalidatePath('/dashboard/contracts')
  return { template }
}

export async function updateContractTemplate(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    content: formData.get('content') as string,
    category: formData.get('category') as string || 'custom',
    updatedAt: new Date(),
  }

  const [template] = await db.update(schema.contractTemplates)
    .set(data)
    .where(eq(schema.contractTemplates.id, id))
    .returning()

  revalidatePath('/dashboard/contracts')
  return { template }
}

export async function deleteContractTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  await db.delete(schema.contractTemplates)
    .where(eq(schema.contractTemplates.id, id))

  revalidatePath('/dashboard/contracts')
  return { success: true }
}

// ============================================
// CONTRACTS
// ============================================

export async function getContracts(search?: string, status?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!dbUser?.organizationId) return { contracts: [] }

  const contracts = await db.query.contracts.findMany({
    where: and(
      eq(schema.contracts.organizationId, dbUser.organizationId),
      isNull(schema.contracts.deletedAt),
    ),
    with: {
      company: true,
      contact: true,
      template: true,
    },
    orderBy: [desc(schema.contracts.updatedAt)],
  })

  // Filter by search and status
  let filtered = contracts
  if (search) {
    filtered = filtered.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.name.toLowerCase().includes(search.toLowerCase())
    )
  }
  if (status && status !== 'all') {
    filtered = filtered.filter(c => c.status === status)
  }

  return { contracts: filtered }
}

export async function getContract(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const contract = await db.query.contracts.findFirst({
    where: eq(schema.contracts.id, id),
    with: {
      company: true,
      contact: true,
      template: true,
      createdBy: true,
    },
  })

  return { contract }
}

import type { ContractFormData } from '@/lib/contracts-definitions' // Import updated

// No re-export to avoid Next.js server action confusion. Import types directly from definitions.


export async function createContract(data: ContractFormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  })

  if (!dbUser?.organizationId) return { error: 'Organisation non trouvée' }

  const contractData = {
    organizationId: dbUser.organizationId,
    createdById: user.id,
    title: data.title,
    content: data.content,
    templateId: data.templateId || null,
    companyId: data.companyId || null,
    contactId: data.contactId || null,
    effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
    expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
    status: 'draft' as const,
  }

  const [contract] = await db.insert(schema.contracts)
    .values(contractData)
    .returning()

  revalidatePath('/dashboard/contracts')
  return { contract }
}

export async function updateContract(id: string, data: Partial<ContractFormData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (data.title) updateData.title = data.title
  if (data.content) updateData.content = data.content
  if (data.companyId) updateData.companyId = data.companyId
  if (data.contactId) updateData.contactId = data.contactId
  if (data.effectiveDate) updateData.effectiveDate = new Date(data.effectiveDate)
  if (data.expirationDate) updateData.expirationDate = new Date(data.expirationDate)

  const [contract] = await db.update(schema.contracts)
    .set(updateData)
    .where(eq(schema.contracts.id, id))
    .returning()

  revalidatePath('/dashboard/contracts')
  return { contract }
}

export async function updateContractStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  }

  // If signed, add signature timestamp
  if (status === 'signed') {
    updateData.signedAt = new Date()
  }

  const [contract] = await db.update(schema.contracts)
    .set(updateData)
    .where(eq(schema.contracts.id, id))
    .returning()

  revalidatePath('/dashboard/contracts')
  return { contract }
}

export async function deleteContract(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  // Soft delete
  await db.update(schema.contracts)
    .set({ deletedAt: new Date() })
    .where(eq(schema.contracts.id, id))

  revalidatePath('/dashboard/contracts')
  return { success: true }
}


export async function replaceTemplateVariables(content: string, contractId: string) {
  const { contract } = await getContract(contractId)
  if (!contract) return content

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const dbUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user!.id),
    with: { organization: true },
  })

  const variables: Record<string, string> = {
    '{{client_name}}': contract.contact
      ? `${contract.contact.firstName || ''} ${contract.contact.lastName || ''}`.trim()
      : '',
    '{{client_company}}': contract.company?.name || '',
    '{{client_email}}': contract.contact?.email || '',
    '{{client_address}}': contract.company?.address || '',
    '{{my_company}}': dbUser?.organization?.name || '',
    '{{my_name}}': `${dbUser?.firstName || ''} ${dbUser?.lastName || ''}`.trim(),
    '{{my_email}}': user?.email || '',
    '{{today}}': new Date().toLocaleDateString('fr-FR'),
    '{{effective_date}}': contract.effectiveDate
      ? new Date(contract.effectiveDate).toLocaleDateString('fr-FR')
      : '',
    '{{expiration_date}}': contract.expirationDate
      ? new Date(contract.expirationDate).toLocaleDateString('fr-FR')
      : '',
  }

  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(key, 'g'), value)
  }

  return result
}
