import { getQuote } from '@/lib/actions/quotes'
import QuoteDetail from './quote-detail'
import { notFound } from 'next/navigation'
import { db } from '@/db'
import { organizations } from '@/db/schema/core'
import { getOrganizationId } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { quote, error } = await getQuote(id)

 if (error || !quote) {
  return notFound()
 }

 // Fetch organization info for the document header
 let organization = null
 try {
  const orgId = await getOrganizationId()
  organization = await db.query.organizations.findFirst({
   where: eq(organizations.id, orgId),
  }) || null
 } catch { }

 return <QuoteDetail quote={quote} organization={organization} />
}
