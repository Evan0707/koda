import { getPublicInvoice } from '@/lib/actions/stripe'
import PaymentClient from './payment-client'
import { notFound } from 'next/navigation'

export default async function PaymentPage({
 params,
}: {
 params: Promise<{ invoiceId: string }>
}) {
 const { invoiceId } = await params
 const result = await getPublicInvoice(invoiceId)

 if (('error' in result && !result.alreadyPaid) || (!result.invoice && !result.alreadyPaid)) {
  notFound()
 }

 // Explicitly map properties to ensure type safety matching PaymentClient props
 let invoiceProps = null

 if (result.invoice) {
  invoiceProps = {
   id: result.invoice.id,
   number: result.invoice.number,
   issueDate: result.invoice.issueDate ? new Date(result.invoice.issueDate) : new Date(),
   dueDate: result.invoice.dueDate ? new Date(result.invoice.dueDate) : null,
   status: result.invoice.status,
   subtotal: result.invoice.subtotal || 0,
   vatAmount: result.invoice.vatAmount || 0,
   total: result.invoice.total || 0,
   notes: result.invoice.notes,
   items: result.invoice.items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.total,
   })),
   contact: result.invoice.contact,
   organization: result.invoice.organization,
  }
 }

 return (
  <PaymentClient
   invoice={invoiceProps}
   hasStripe={result.hasStripe || false}
   alreadyPaid={result.alreadyPaid || false}
  />
 )
}
