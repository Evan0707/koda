import { getQuotes } from '@/lib/actions/quotes'
import QuotesClient from './quotes-client'

export default async function QuotesPage() {
 const { quotes, error } = await getQuotes()

 if (error) {
  return <div>Erreur: {error}</div>
 }

 return <QuotesClient initialQuotes={quotes || []} />
}
