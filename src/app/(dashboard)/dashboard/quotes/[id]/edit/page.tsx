import { getQuote } from '@/lib/actions/quotes'
import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { getProducts } from '@/lib/actions/products'
import QuoteEditForm from './quote-edit-form'
import { notFound } from 'next/navigation'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const [quoteRes, companiesRes, contactsRes, productsRes] = await Promise.all([
  getQuote(id),
  getCompanies(),
  getContacts(),
  getProducts(),
 ])

 if (quoteRes.error || !quoteRes.quote) {
  return notFound()
 }

 // Only draft/rejected quotes can be edited
 if (quoteRes.quote.status !== 'draft' && quoteRes.quote.status !== 'rejected') {
  return notFound()
 }

 return (
  <QuoteEditForm
   quote={quoteRes.quote}
   companies={companiesRes.companies || []}
   contacts={contactsRes.contacts || []}
   products={productsRes.products || []}
  />
 )
}
