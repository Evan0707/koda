import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { getProducts } from '@/lib/actions/products'
import QuoteForm from './quote-form'

export default async function CreateQuotePage() {
 const [companiesRes, contactsRes, productsRes] = await Promise.all([
  getCompanies(),
  getContacts(),
  getProducts(),
 ])

 return (
  <QuoteForm
   companies={companiesRes.companies || []}
   contacts={contactsRes.contacts || []}
   products={productsRes.products || []}
  />
 )
}
