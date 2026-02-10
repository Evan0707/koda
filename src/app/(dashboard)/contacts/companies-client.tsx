'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
 Building2,
 Search,
 Plus,
 MoreVertical,
 Pencil,
 Trash2,
 Globe,
 MapPin,
 Users,
 Loader2,
} from 'lucide-react'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCompanies, createCompany, updateCompany, deleteCompany } from '@/lib/actions/companies'

type Company = {
 id: string
 name: string
 website: string | null
 industry: string | null
 size: string | null
 city: string | null
 country: string | null
}

export default function CompaniesClient() {
 const [companies, setCompanies] = useState<Company[]>([])
 const [search, setSearch] = useState('')
 const [isLoading, setIsLoading] = useState(true)
 const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [editingCompany, setEditingCompany] = useState<Company | null>(null)
 const [isPending, startTransition] = useTransition()

 // Load companies
 const loadCompanies = async () => {
  setIsLoading(true)
  const result = await getCompanies(search || undefined)
  if (result.companies) {
   setCompanies(result.companies as Company[])
  }
  setIsLoading(false)
 }

 useEffect(() => {
  loadCompanies()
 }, [search])

 // Handle form submit
 const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
   let result
   if (editingCompany) {
    result = await updateCompany(editingCompany.id, formData)
   } else {
    result = await createCompany(formData)
   }

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(editingCompany ? 'Entreprise modifiée' : 'Entreprise créée')
    setIsDialogOpen(false)
    setEditingCompany(null)
    loadCompanies()
   }
  })
 }

 // Handle delete
 const handleDelete = async (id: string) => {
  if (!confirm('Supprimer cette entreprise ?')) return

  startTransition(async () => {
   const result = await deleteCompany(id)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Entreprise supprimée')
    loadCompanies()
   }
  })
 }

 // Open edit dialog
 const openEdit = (company: Company) => {
  setEditingCompany(company)
  setIsDialogOpen(true)
 }

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-white">Entreprises</h1>
     <p className="text-slate-400">Gérez vos clients et prospects</p>
    </div>

    <Dialog open={isDialogOpen} onOpenChange={(open) => {
     setIsDialogOpen(open)
     if (!open) setEditingCompany(null)
    }}>
     <DialogTrigger asChild>
      <Button className="bg-indigo-600 hover:bg-indigo-700">
       <Plus className="w-4 h-4 mr-2" />
       Nouvelle entreprise
      </Button>
     </DialogTrigger>
     <DialogContent className="bg-slate-900 border-slate-700">
      <DialogHeader>
       <DialogTitle className="text-white">
        {editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
       </DialogTitle>
      </DialogHeader>
      <form action={handleSubmit} className="space-y-4">
       <div className="space-y-2">
        <Label className="text-slate-300">Nom *</Label>
        <Input
         name="name"
         placeholder="Nom de l'entreprise"
         defaultValue={editingCompany?.name || ''}
         required
         className="bg-slate-800 border-slate-700 text-white"
        />
       </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
         <Label className="text-slate-300">Site web</Label>
         <Input
          name="website"
          placeholder="https://..."
          defaultValue={editingCompany?.website || ''}
          className="bg-slate-800 border-slate-700 text-white"
         />
        </div>
        <div className="space-y-2">
         <Label className="text-slate-300">Secteur</Label>
         <Input
          name="industry"
          placeholder="Tech, Finance..."
          defaultValue={editingCompany?.industry || ''}
          className="bg-slate-800 border-slate-700 text-white"
         />
        </div>
       </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
         <Label className="text-slate-300">Ville</Label>
         <Input
          name="city"
          placeholder="Paris"
          defaultValue={editingCompany?.city || ''}
          className="bg-slate-800 border-slate-700 text-white"
         />
        </div>
        <div className="space-y-2">
         <Label className="text-slate-300">Taille</Label>
         <Input
          name="size"
          placeholder="1-10, 11-50..."
          defaultValue={editingCompany?.size || ''}
          className="bg-slate-800 border-slate-700 text-white"
         />
        </div>
       </div>
       <div className="flex justify-end gap-3 pt-4">
        <Button
         type="button"
         variant="ghost"
         onClick={() => setIsDialogOpen(false)}
         className="text-slate-400"
        >
         Annuler
        </Button>
        <Button
         type="submit"
         disabled={isPending}
         className="bg-indigo-600 hover:bg-indigo-700"
        >
         {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
         ) : editingCompany ? 'Modifier' : 'Créer'}
        </Button>
       </div>
      </form>
     </DialogContent>
    </Dialog>
   </div>

   {/* Search */}
   <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    <Input
     placeholder="Rechercher une entreprise..."
     value={search}
     onChange={(e) => setSearch(e.target.value)}
     className="pl-10 bg-slate-800/50 border-slate-700 text-white"
    />
   </div>

   {/* Companies Grid */}
   {isLoading ? (
    <div className="flex items-center justify-center py-12">
     <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
   ) : companies.length === 0 ? (
    <Card className="bg-slate-800/50 border-slate-700">
     <CardContent className="py-12 text-center">
      <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
       Aucune entreprise
      </h3>
      <p className="text-slate-400 mb-4">
       Créez votre première entreprise pour commencer
      </p>
      <Button
       onClick={() => setIsDialogOpen(true)}
       className="bg-indigo-600 hover:bg-indigo-700"
      >
       <Plus className="w-4 h-4 mr-2" />
       Créer une entreprise
      </Button>
     </CardContent>
    </Card>
   ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
     {companies.map((company) => (
      <Card
       key={company.id}
       className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
      >
       <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
         <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
           <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
           <CardTitle className="text-white text-base">
            {company.name}
           </CardTitle>
           {company.industry && (
            <p className="text-xs text-slate-400">{company.industry}</p>
           )}
          </div>
         </div>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
           <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4 text-slate-400" />
           </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
           <DropdownMenuItem
            onClick={() => openEdit(company)}
            className="text-slate-300 focus:text-white focus:bg-slate-700"
           >
            <Pencil className="w-4 h-4 mr-2" />
            Modifier
           </DropdownMenuItem>
           <DropdownMenuItem
            onClick={() => handleDelete(company.id)}
            className="text-red-400 focus:text-red-300 focus:bg-slate-700"
           >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
           </DropdownMenuItem>
          </DropdownMenuContent>
         </DropdownMenu>
        </div>
       </CardHeader>
       <CardContent className="pt-0">
        <div className="space-y-2 text-sm">
         {company.website && (
          <div className="flex items-center gap-2 text-slate-400">
           <Globe className="w-3.5 h-3.5" />
           <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-400 truncate"
           >
            {company.website.replace(/^https?:\/\//, '')}
           </a>
          </div>
         )}
         {company.city && (
          <div className="flex items-center gap-2 text-slate-400">
           <MapPin className="w-3.5 h-3.5" />
           <span>{company.city}</span>
          </div>
         )}
         {company.size && (
          <div className="flex items-center gap-2 text-slate-400">
           <Users className="w-3.5 h-3.5" />
           <span>{company.size} employés</span>
          </div>
         )}
        </div>
       </CardContent>
      </Card>
     ))}
    </div>
   )}
  </div>
 )
}
