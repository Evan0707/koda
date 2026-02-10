import { getPublicQuote } from '@/lib/actions/quote-signature'
import QuoteSignatureClient from './quote-signature-client'
import { notFound } from 'next/navigation'

export default async function PublicQuotePage({
 params,
}: {
 params: Promise<{ quoteId: string }>
}) {
 const { quoteId } = await params
 const { quote, error } = await getPublicQuote(quoteId)

 if (error || !quote) {
  return notFound()
 }

 return <QuoteSignatureClient quote={quote} />
}
