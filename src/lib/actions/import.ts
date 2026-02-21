'use server'

import { db } from '@/db'
import { contacts, companies, tags, taggables } from '@/db/schema/crm'
import { getOrganizationId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { CSVContact } from '@/lib/csv-parser'

type ImportResult = {
 success?: boolean
 count?: number
 errors?: string[]
 error?: string
}

export async function importContacts(data: CSVContact[]): Promise<ImportResult> {
 try {
  const organizationId = await getOrganizationId()

  // Check contact limit before importing
  const { checkContactBulkLimit } = await import('./plan-limits')
  const limitCheck = await checkContactBulkLimit(data.length)
  if (!limitCheck.canImport) {
   return { error: limitCheck.error }
  }

  let createdCount = 0
  const errors: string[] = []

  // Pre-fetch all existing companies & tags for this org (avoids N+1)
  const existingCompanies = await db.query.companies.findMany({
   where: eq(companies.organizationId, organizationId),
   columns: { id: true, name: true },
  })
  const companyMap = new Map(existingCompanies.map(c => [c.name.toLowerCase(), c.id]))

  const existingTags = await db.query.tags.findMany({
   where: eq(tags.organizationId, organizationId),
   columns: { id: true, name: true },
  })
  const tagMap = new Map(existingTags.map(t => [t.name.toLowerCase(), t.id]))

  // Process in batches of 50 within a transaction
  const BATCH_SIZE = 50
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
   const batch = data.slice(i, i + BATCH_SIZE)

   await db.transaction(async (tx) => {
    for (const row of batch) {
     try {
      // 1. Handle Company (use cache, insert if new)
      let companyId: string | null = null
      if (row.companyName) {
       const key = row.companyName.toLowerCase()
       if (companyMap.has(key)) {
        companyId = companyMap.get(key)!
       } else {
        const [newCompany] = await tx.insert(companies).values({
         organizationId,
         name: row.companyName,
        }).returning()
        companyId = newCompany.id
        companyMap.set(key, companyId)
       }
      }

      // 2. Create Contact
      const [contact] = await tx.insert(contacts).values({
       organizationId,
       companyId,
       firstName: row.firstName || 'Inconnu',
       lastName: row.lastName,
       email: row.email,
       phone: row.phone,
       jobTitle: row.jobTitle,
       source: 'import_csv',
      }).returning()

      createdCount++

      // 3. Handle Tags (use cache, insert if new)
      if (row.tags) {
       const tagNames = row.tags.split(',').map(t => t.trim()).filter(Boolean)

       for (const tagName of tagNames) {
        const key = tagName.toLowerCase()
        let tagId: string

        if (tagMap.has(key)) {
         tagId = tagMap.get(key)!
        } else {
         const [newTag] = await tx.insert(tags).values({
          organizationId,
          name: tagName,
          color: '#6366F1',
         }).returning()
         tagId = newTag.id
         tagMap.set(key, tagId)
        }

        await tx.insert(taggables).values({
         tagId,
         taggableId: contact.id,
         taggableType: 'contact',
        })
       }
      }

     } catch (err) {
      console.error('Error importing row:', row, err)
      errors.push(`Erreur pour ${row.firstName} ${row.lastName || ''}`)
     }
    }
   })
  }

  revalidatePath('/dashboard/contacts')
  return { success: true, count: createdCount, errors: errors.length > 0 ? errors : undefined }

 } catch (error) {
  console.error('Global import error:', error)
  return { error: 'Erreur critique lors de l\'import' }
 }
}
