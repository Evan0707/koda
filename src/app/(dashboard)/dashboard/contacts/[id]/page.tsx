import { notFound } from 'next/navigation'
import { db, schema } from '@/db'
import { contacts, activities, opportunities, tags, taggables } from '@/db/schema/crm'
import { eq, desc, and, asc, isNull } from 'drizzle-orm'
import { getOrganizationId } from '@/lib/auth'
import ContactView from './contact-view'

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
 const organizationId = await getOrganizationId()
 const { id } = await params

 // Fetch contact with company
 const contact = await db.query.contacts.findFirst({
  where: eq(contacts.id, id),
  with: {
   company: true,
  }
 })

 if (!contact || contact.organizationId !== organizationId) {
  notFound()
 }

 // Fetch activities
 const contactActivities = await db.query.activities.findMany({
  where: eq(activities.contactId, id),
  orderBy: [desc(activities.performedAt)],
  with: {
   creator: true
  }
 })

 // Fetch opportunities
 const contactOpportunities = await db.query.opportunities.findMany({
  where: eq(opportunities.contactId, id),
  with: {
   stage: true
  }
 })

 // Fetch all tags for the organization
 const allTags = await db.select().from(tags).where(eq(tags.organizationId, organizationId)).orderBy(asc(tags.name))

 // Fetch assigned tags
 const assignedTags = await db.select({
  id: tags.id,
  name: tags.name,
  color: tags.color
 })
  .from(tags)
  .innerJoin(taggables, eq(taggables.tagId, tags.id))
  .where(and(
   eq(taggables.taggableId, id),
   eq(taggables.taggableType, 'contact')
  ))

 const contactWithTags = {
  ...contact,
  allTags,
  tags: assignedTags
 }

 // Fetch linked invoices
 const contactInvoices = await db.query.invoices.findMany({
  where: and(
   eq(schema.invoices.contactId, id),
   eq(schema.invoices.organizationId, organizationId),
   isNull(schema.invoices.deletedAt),
  ),
  orderBy: [desc(schema.invoices.createdAt)],
 })

 // Fetch linked quotes
 const contactQuotes = await db.query.quotes.findMany({
  where: and(
   eq(schema.quotes.contactId, id),
   eq(schema.quotes.organizationId, organizationId),
   isNull(schema.quotes.deletedAt),
  ),
  orderBy: [desc(schema.quotes.createdAt)],
 })

 return (
  <ContactView
   contact={contactWithTags}
   activities={contactActivities}
   opportunities={contactOpportunities}
   invoices={contactInvoices}
   quotes={contactQuotes}
  />
 )
}
