'use server'

import { db } from '@/db'
import { contacts, companies, tags, taggables } from '@/db/schema/crm'
import { getOrganizationId } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { eq, and } from 'drizzle-orm'
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
  let createdCount = 0
  let errors: string[] = []

  for (const row of data) {
   try {
    // 1. Handle Company
    let companyId: string | null = null
    if (row.companyName) {
     const existingCompany = await db.query.companies.findFirst({
      where: and(
       eq(companies.organizationId, organizationId),
       eq(companies.name, row.companyName)
      )
     })

     if (existingCompany) {
      companyId = existingCompany.id
     } else {
      const [newCompany] = await db.insert(companies).values({
       organizationId,
       name: row.companyName,
      }).returning()
      companyId = newCompany.id
     }
    }

    // 2. Create Contact
    const [contact] = await db.insert(contacts).values({
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

    // 3. Handle Tags
    if (row.tags) {
     const tagNames = row.tags.split(',').map(t => t.trim()).filter(Boolean)

     for (const tagName of tagNames) {
      let tagId
      const existingTag = await db.query.tags.findFirst({
       where: and(
        eq(tags.organizationId, organizationId),
        eq(tags.name, tagName)
       )
      })

      if (existingTag) {
       tagId = existingTag.id
      } else {
       const [newTag] = await db.insert(tags).values({
        organizationId,
        name: tagName,
        color: '#6366F1' // Default color
       }).returning()
       tagId = newTag.id
      }

      // Assign tag
      await db.insert(taggables).values({
       tagId,
       taggableId: contact.id,
       taggableType: 'contact'
      })
     }
    }

   } catch (err) {
    console.error('Error importing row:', row, err)
    errors.push(`Erreur pour ${row.firstName} ${row.lastName || ''}`)
   }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true, count: createdCount, errors: errors.length > 0 ? errors : undefined }

 } catch (error) {
  console.error('Global import error:', error)
  return { error: 'Erreur critique lors de l\'import' }
 }
}
