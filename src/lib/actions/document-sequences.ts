'use server'

import { db } from '@/db'
import { documentSequences } from '@/db/schema/settings'
import { getOrganizationId } from '@/lib/auth'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// TYPES
// ============================================
export type DocumentSequence = {
 id: string
 organizationId: string
 type: string
 prefix: string | null
 suffix: string | null
 currentNumber: number | null
 paddingLength: number | null
 includeYear: boolean | null
}

const sequenceSchema = z.object({
 type: z.enum(['quote', 'invoice', 'contract']),
 prefix: z.string().default(''),
 suffix: z.string().default(''),
 currentNumber: z.coerce.number().min(1).default(1),
 paddingLength: z.coerce.number().min(1).max(8).default(4),
 includeYear: z.boolean().default(true),
})

export type SequenceFormData = z.infer<typeof sequenceSchema>

// ============================================
// READ
// ============================================
export async function getDocumentSequences() {
 try {
  const organizationId = await getOrganizationId()

  const sequences = await db.query.documentSequences.findMany({
   where: eq(documentSequences.organizationId, organizationId),
  })

  return { sequences: sequences as DocumentSequence[] }
 } catch (error) {
  console.error('Error fetching document sequences:', error)
  return { error: 'Erreur lors de la récupération des séquences' }
 }
}

// ============================================
// UPSERT
// ============================================
export async function upsertDocumentSequence(data: SequenceFormData) {
 try {
  const organizationId = await getOrganizationId()
  const validated = sequenceSchema.parse(data)

  // Check if sequence for this type already exists
  const existing = await db.query.documentSequences.findFirst({
   where: and(
    eq(documentSequences.organizationId, organizationId),
    eq(documentSequences.type, validated.type),
   ),
  })

  if (existing) {
   await db
    .update(documentSequences)
    .set({
     prefix: validated.prefix,
     suffix: validated.suffix,
     currentNumber: validated.currentNumber,
     paddingLength: validated.paddingLength,
     includeYear: validated.includeYear,
     updatedAt: new Date(),
    })
    .where(eq(documentSequences.id, existing.id))
  } else {
   await db.insert(documentSequences).values({
    organizationId,
    type: validated.type,
    prefix: validated.prefix,
    suffix: validated.suffix,
    currentNumber: validated.currentNumber,
    paddingLength: validated.paddingLength,
    includeYear: validated.includeYear,
   })
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
 } catch (error) {
  console.error('Error upserting document sequence:', error)
  return { error: 'Erreur lors de la sauvegarde' }
 }
}


