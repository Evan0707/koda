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

 if ('error' in result && !result.alreadyPaid) {
  notFound()
 }

 return (
  <PaymentClient
   invoice={result.invoice || null}
   hasStripe={result.hasStripe || false}
   alreadyPaid={result.alreadyPaid || false}
  />
 )
}
