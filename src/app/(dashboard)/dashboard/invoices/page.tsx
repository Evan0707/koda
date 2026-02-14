import { getInvoices } from '@/lib/actions/invoices'
import InvoicesClient from './invoices-client'
import { ErrorState } from '@/components/error-state'

export default async function InvoicesPage() {
 const { invoices, error } = await getInvoices()

 if (error) {
  return <ErrorState message={error} />
 }

 return <InvoicesClient initialInvoices={invoices || []} />
}
