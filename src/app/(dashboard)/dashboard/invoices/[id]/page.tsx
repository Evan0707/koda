import { getInvoice } from '@/lib/actions/invoices'
import InvoiceDetail from './invoice-detail'
import { notFound } from 'next/navigation'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { invoice, error } = await getInvoice(id)

 if (error || !invoice) {
  return notFound()
 }

 return <InvoiceDetail invoice={invoice} />
}
