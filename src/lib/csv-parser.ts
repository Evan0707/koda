import Papa from 'papaparse'

export type CSVContact = {
 firstName: string
 lastName?: string
 email?: string
 phone?: string
 jobTitle?: string
 companyName?: string
 tags?: string // Comma separated tags
}

export async function parseCSV(file: File): Promise<{ data: CSVContact[], error?: string }> {
 return new Promise((resolve) => {
  Papa.parse(file, {
   header: true,
   skipEmptyLines: true,
   complete: (results: any) => {
    if (results.errors.length > 0) {
     resolve({ data: [], error: 'Erreur lors de la lecture du fichier CSV' })
     return
    }

    const data = results.data.map((row: any) => ({
     firstName: row['Prénom'] || row['First Name'] || row['firstName'],
     lastName: row['Nom'] || row['Last Name'] || row['lastName'],
     email: row['Email'] || row['Email Address'] || row['email'],
     phone: row['Téléphone'] || row['Phone'] || row['phone'],
     jobTitle: row['Fonction'] || row['Job Title'] || row['jobTitle'],
     companyName: row['Entreprise'] || row['Company'] || row['company'],
     tags: row['Tags'] || row['tags']
    })).filter((c: CSVContact) => c.firstName || c.email) // Require at least name or email

    resolve({ data })
   },
   error: (error: any) => {
    resolve({ data: [], error: error.message })
   }
  })
 })
}
