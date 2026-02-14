'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { parseCSV, CSVContact } from '@/lib/csv-parser'
import { importContacts } from '@/lib/actions/import'
import { toast } from 'sonner'
import { Upload, FileUp, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ImportPage() {
 const [file, setFile] = useState<File | null>(null)
 const [preview, setPreview] = useState<CSVContact[]>([])
 const [isPending, startTransition] = useTransition()
 const router = useRouter()

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFile = e.target.files?.[0]
  if (!selectedFile) return

  setFile(selectedFile)
  const result = await parseCSV(selectedFile)
  if (result.error) {
   toast.error(result.error)
   setFile(null)
  } else {
   setPreview(result.data.slice(0, 5)) // Preview first 5
  }
 }

 const handleImport = () => {
  if (!file) return

  startTransition(async () => {
   // Re-parse full file to be sure
   const result = await parseCSV(file)
   if (result.error) {
    toast.error(result.error)
    return
   }

   const importResult = await importContacts(result.data)

   if (importResult.error) {
    toast.error(importResult.error)
   } else {
    toast.success(`${importResult.count} contacts importés avec succès !`)
    if (importResult.errors && importResult.errors.length > 0) {
     toast.warning(`Quelques erreurs : ${importResult.errors.length} échecs`)
    }
    router.push('/dashboard/contacts')
   }
  })
 }

 return (
  <div className="max-w-4xl mx-auto space-y-6">
   <div className="flex items-center gap-4 mb-6">
    <Link
     href="/dashboard/contacts"
     className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
    </Link>
    <h1 className="text-2xl font-bold text-foreground">Importer des contacts</h1>
   </div>

   <Card>
    <CardHeader>
     <CardTitle className="flex items-center gap-2">
      <Upload className="w-5 h-5" />
      Sélectionner un fichier CSV
     </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
     <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-muted transition-colors relative">
      <Input
       type="file"
       accept=".csv"
       onChange={handleFileChange}
       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
       <FileUp className="w-10 h-10 text-muted-foreground/70" />
       <p className="font-medium">
        {file ? file.name : 'Cliquez ou glissez un fichier CSV ici'}
       </p>
       <p className="text-xs text-muted-foreground">
        Format attendu: Prénom, Nom, Email, Entreprise, Fonction, Tags
       </p>
      </div>
     </div>

     {preview.length > 0 && (
      <div className="space-y-4">
       <h3 className="font-semibold text-foreground">Aperçu ({preview.length} premiers)</h3>
       <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
         <thead className="bg-muted border-b">
          <tr>
           <th className="px-4 py-2 text-left">Prénom</th>
           <th className="px-4 py-2 text-left">Nom</th>
           <th className="px-4 py-2 text-left">Email</th>
           <th className="px-4 py-2 text-left">Entreprise</th>
           <th className="px-4 py-2 text-left">Tags</th>
          </tr>
         </thead>
         <tbody>
          {preview.map((row, i) => (
           <tr key={i} className="border-b last:border-0">
            <td className="px-4 py-2">{row.firstName}</td>
            <td className="px-4 py-2">{row.lastName}</td>
            <td className="px-4 py-2 text-muted-foreground">{row.email}</td>
            <td className="px-4 py-2">{row.companyName}</td>
            <td className="px-4 py-2">{row.tags}</td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     )}

     <div className="flex justify-end gap-3">
      <Button variant="outline" onClick={() => setFile(null)} disabled={!file || isPending}>
       Annuler
      </Button>
      <Button
       onClick={handleImport}
       disabled={!file || isPending}
       
      >
       {isPending ? (
        <>
         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
         Importation...
        </>
       ) : (
        <>
         <CheckCircle className="w-4 h-4 mr-2" />
         Importer maintenant
        </>
       )}
      </Button>
     </div>
    </CardContent>
   </Card>

   <Card>
    <CardHeader>
     <CardTitle className="text-sm font-medium text-muted-foreground">Modèle CSV</CardTitle>
    </CardHeader>
    <CardContent>
     <div className="bg-muted p-3 rounded text-xs font-mono text-muted-foreground overflow-x-auto">
      Prénom,Nom,Email,Téléphone,Entreprise,Fonction,Tags<br />
      Jean,Dupont,jean@exemple.com,0612345678,Acme Corp,CEO,"Client,VIP"<br />
      Marie,Martin,marie@test.com,,StartUp Inc,CTO,Prospect
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
