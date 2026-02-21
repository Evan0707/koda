import { getCompanies } from '@/lib/actions/companies'
import { getContacts } from '@/lib/actions/contacts'
import { getProducts } from '@/lib/actions/products'
import { getProjects } from '@/lib/actions/projects'
import InvoiceForm from './invoice-form'

export default async function CreateInvoicePage() {
 const [companiesRes, contactsRes, productsRes, projectsRes] = await Promise.all([
  getCompanies(),
  getContacts(),
  getProducts(),
  getProjects(),
 ])

 return (
  <InvoiceForm
   companies={companiesRes.companies || []}
   contacts={contactsRes.contacts || []}
   products={productsRes.products || []}
   projects={projectsRes.projects || []}
  />
 )
}
