import { db, schema } from '@/db'
import { getOrganizationId } from '@/lib/auth'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { CompanyDetailView } from './company-detail-view'

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const organizationId = await getOrganizationId()
  const { id } = await params

  // Fetch company
  const company = await db.query.companies.findFirst({
    where: and(
      eq(schema.companies.id, id),
      eq(schema.companies.organizationId, organizationId),
      isNull(schema.companies.deletedAt),
    ),
  })

  if (!company) notFound()

  // Fetch linked contacts
  const contacts = await db.query.contacts.findMany({
    where: and(
      eq(schema.contacts.companyId, id),
      eq(schema.contacts.organizationId, organizationId),
      isNull(schema.contacts.deletedAt),
    ),
    orderBy: [desc(schema.contacts.createdAt)],
  })

  // Fetch invoices linked to this company
  const invoices = await db.query.invoices.findMany({
    where: and(
      eq(schema.invoices.companyId, id),
      eq(schema.invoices.organizationId, organizationId),
      isNull(schema.invoices.deletedAt),
    ),
    with: { contact: true },
    orderBy: [desc(schema.invoices.createdAt)],
  })

  // Fetch quotes linked to this company
  const quotes = await db.query.quotes.findMany({
    where: and(
      eq(schema.quotes.companyId, id),
      eq(schema.quotes.organizationId, organizationId),
      isNull(schema.quotes.deletedAt),
    ),
    with: { contact: true },
    orderBy: [desc(schema.quotes.createdAt)],
  })

  return (
    <CompanyDetailView
      company={company}
      contacts={contacts}
      invoices={invoices}
      quotes={quotes}
    />
  )
}
