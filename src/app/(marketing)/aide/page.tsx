import { Metadata } from 'next'
import AideClient from './aide-client'

export const metadata: Metadata = {
 title: "Centre d'aide | KodaFlow",
 description: "Trouvez rapidement des réponses à vos questions sur KodaFlow. FAQ, guides et support.",
}

export default function AidePage() {
 return <AideClient />
}
