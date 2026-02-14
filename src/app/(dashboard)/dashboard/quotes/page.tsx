import { getQuotes } from '@/lib/actions/quotes'
import QuotesClient from './quotes-client'
import { ErrorState } from '@/components/error-state'

export default async function QuotesPage() {
 const { quotes, error } = await getQuotes()

 if (error) {
  return <ErrorState message={error} />
 }

 return <QuotesClient initialQuotes={quotes || []} />
}
