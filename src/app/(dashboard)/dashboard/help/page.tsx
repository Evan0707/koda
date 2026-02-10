import { Metadata } from 'next'
import HelpClient from './help-client'

export const metadata: Metadata = {
 title: 'Aide | KodaFlow',
 description: 'Centre d\'aide et documentation KodaFlow',
}

export default function HelpPage() {
 return <HelpClient />
}
