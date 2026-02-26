'use server'

export async function searchAddress(query: string) {
 try {
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`, {
   headers: {
    'Accept': 'application/json'
   }
  })

  if (!res.ok) {
   return { error: 'API Error' }
  }

  const data = await res.json()
  return { features: data.features || [] }
 } catch (error) {
  console.error('Error fetching addresses from server:', error)
  return { error: 'Failed to fetch addresses' }
 }
}
