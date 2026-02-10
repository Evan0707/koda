import { getInvoices } from '@/lib/actions/invoices'
import InvoicesClient from './invoices-client'

export default async function InvoicesPage() {
 const { invoices, error } = await getInvoices()

 if (error) {
  return <div>Erreur: {error}</div>
 }

 return <InvoicesClient initialInvoices={invoices || []} />
}
