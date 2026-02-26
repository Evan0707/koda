import { getTrashItems, cleanupOldTrash } from '@/lib/actions/archive'
import TrashClient from './trash-client'

export const metadata = {
 title: 'Corbeille | KodaFlow',
 description: 'Gérez vos éléments supprimés',
}

export default async function TrashPage() {
 // Passively trigger cleanup when visiting the page
 cleanupOldTrash().catch(console.error)

 const result = await getTrashItems()

 return <TrashClient initialItems={result.items || []} />
}
