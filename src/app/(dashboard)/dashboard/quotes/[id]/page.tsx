import { getQuote } from '@/lib/actions/quotes'
import QuoteDetail from './quote-detail'
import { notFound } from 'next/navigation'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params
 const { quote, error } = await getQuote(id)

 if (error || !quote) {
  return notFound()
 }

 return <QuoteDetail quote={quote} />
}
