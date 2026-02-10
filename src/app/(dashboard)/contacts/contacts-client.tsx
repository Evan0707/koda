'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
 Users,
 Building2,
 Search,
 Plus,
 MoreVertical,
 Pencil,
 Trash2,
 Mail,
 Phone,
 Loader2,
 User,
} from 'lucide-react'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/actions/contacts'
import { getCompanies } from '@/lib/actions/companies'
import CompaniesClient from './companies-client'
import { Contact, Company } from '@/types/db'

type ContactWithCompany = Contact & {
 company: Company | null
}

export default function ContactsClient() {
 const [contacts, setContacts] = useState<ContactWithCompany[]>([])
 const [companies, setCompanies] = useState<Company[]>([])
 const [search, setSearch] = useState('')
 const [isLoading, setIsLoading] = useState(true)
 const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [editingContact, setEditingContact] = useState<Contact | null>(null)
 const [isPending, startTransition] = useTransition()
 const [activeTab, setActiveTab] = useState('contacts')

 const loadData = async () => {
  setIsLoading(true)
  const [contactsRes, companiesRes] = await Promise.all([
   getContacts(search || undefined),
   getCompanies()
  ])
  if (contactsRes.contacts) {
   setContacts(contactsRes.contacts as ContactWithCompany[])
  }
  if (companiesRes.companies) {
   setCompanies(companiesRes.companies as Company[])
  }
  setIsLoading(false)
 }

 useEffect(() => {
  if (activeTab === 'contacts') {
   loadData()
  }
 }, [search, activeTab])

 const handleSubmit = async (formData: FormData) => {
  startTransition(async () => {
   let result
   if (editingContact) {
    result = await updateContact(editingContact.id, formData)
   } else {
    result = await createContact(formData)
   }

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(editingContact ? 'Contact modifié' : 'Contact créé')
    setIsDialogOpen(false)
    setEditingContact(null)
    loadData()
   }
  })
 }

 const handleDelete = async (id: string) => {
  if (!confirm('Supprimer ce contact ?')) return

  startTransition(async () => {
   const result = await deleteContact(id)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Contact supprimé')
    loadData()
   }
  })
 }

 const openEdit = (contact: Contact) => {
  setEditingContact(contact)
  setIsDialogOpen(true)
 }

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
     <p className="text-gray-500">Gérez vos contacts et entreprises</p>
    </div>
   </div>

   <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="bg-gray-100">
     <TabsTrigger value="contacts" className="data-[state=active]:bg-white">
      <Users className="w-4 h-4 mr-2" />
      Contacts
     </TabsTrigger>
     <TabsTrigger value="companies" className="data-[state=active]:bg-white">
      <Building2 className="w-4 h-4 mr-2" />
      Entreprises
     </TabsTrigger>
    </TabsList>

    <TabsContent value="contacts" className="space-y-6">
     <div className="flex items-center gap-4">
      <div className="relative flex-1">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
       <Input
        placeholder="Rechercher un contact..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
       />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
       setIsDialogOpen(open)
       if (!open) setEditingContact(null)
      }}>
       <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
         <Plus className="w-4 h-4 mr-2" />
         Nouveau contact
        </Button>
       </DialogTrigger>
       <DialogContent>
        <DialogHeader>
         <DialogTitle>
          {editingContact ? 'Modifier le contact' : 'Nouveau contact'}
         </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
         <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
           <Label>Prénom *</Label>
           <Input
            name="firstName"
            placeholder="Prénom"
            defaultValue={editingContact?.firstName || ''}
            required
           />
          </div>
          <div className="space-y-2">
           <Label>Nom</Label>
           <Input
            name="lastName"
            placeholder="Nom"
            defaultValue={editingContact?.lastName || ''}
           />
          </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
           <Label>Email</Label>
           <Input
            name="email"
            type="email"
            placeholder="email@example.com"
            defaultValue={editingContact?.email || ''}
           />
          </div>
          <div className="space-y-2">
           <Label>Téléphone</Label>
           <Input
            name="phone"
            placeholder="+33 6 12 34 56 78"
            defaultValue={editingContact?.phone || ''}
           />
          </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
           <Label>Fonction</Label>
           <Input
            name="jobTitle"
            placeholder="CEO, CTO..."
            defaultValue={editingContact?.jobTitle || ''}
           />
          </div>
          <div className="space-y-2">
           <Label>Entreprise</Label>
           <select
            name="companyId"
            defaultValue={editingContact?.companyId || ''}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
           >
            <option value="">Aucune</option>
            {companies.map((company) => (
             <option key={company.id} value={company.id}>
              {company.name}
             </option>
            ))}
           </select>
          </div>
         </div>
         <div className="flex justify-end gap-3 pt-4">
          <Button
           type="button"
           variant="ghost"
           onClick={() => setIsDialogOpen(false)}
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
           ) : editingContact ? 'Modifier' : 'Créer'}
          </Button>
         </div>
        </form>
       </DialogContent>
      </Dialog>
     </div>

     {isLoading ? (
      <div className="flex items-center justify-center py-12">
       <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
     ) : contacts.length === 0 ? (
      <Card>
       <CardContent className="py-12 text-center">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
         Aucun contact
        </h3>
        <p className="text-gray-500 mb-4">
         Créez votre premier contact pour commencer
        </p>
        <Button
         onClick={() => setIsDialogOpen(true)}
         className="bg-indigo-600 hover:bg-indigo-700"
        >
         <Plus className="w-4 h-4 mr-2" />
         Créer un contact
        </Button>
       </CardContent>
      </Card>
     ) : (
      <div className="bg-white rounded-lg border overflow-hidden">
       <table className="w-full">
        <thead className="bg-gray-50 border-b">
         <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
           Contact
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
           Entreprise
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
           Email
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
           Téléphone
          </th>
          <th className="px-4 py-3 w-10"></th>
         </tr>
        </thead>
        <tbody className="divide-y">
         {contacts.map((contact) => (
          <tr key={contact.id} className="hover:bg-gray-50">
           <td className="px-4 py-3">
            <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-600">
               {(contact.firstName || '?')[0]}{contact.lastName?.[0] || ''}
              </span>
             </div>
             <div>
              <p className="font-medium text-gray-900">
               {contact.firstName || ''} {contact.lastName || ''}
              </p>
              {contact.jobTitle && (
               <p className="text-xs text-gray-500">{contact.jobTitle}</p>
              )}
             </div>
            </div>
           </td>
           <td className="px-4 py-3 text-gray-600">
            {contact.company?.name || '—'}
           </td>
           <td className="px-4 py-3">
            {contact.email ? (
             <a
              href={`mailto:${contact.email}`}
              className="flex items-center gap-1 text-gray-600 hover:text-indigo-600"
             >
              <Mail className="w-3.5 h-3.5" />
              {contact.email}
             </a>
            ) : (
             <span className="text-gray-400">—</span>
            )}
           </td>
           <td className="px-4 py-3">
            {contact.phone ? (
             <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1 text-gray-600 hover:text-indigo-600"
             >
              <Phone className="w-3.5 h-3.5" />
              {contact.phone}
             </a>
            ) : (
             <span className="text-gray-400">—</span>
            )}
           </td>
           <td className="px-4 py-3">
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
               <MoreVertical className="w-4 h-4 text-gray-400" />
              </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(contact)}>
               <Pencil className="w-4 h-4 mr-2" />
               Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
               onClick={() => handleDelete(contact.id)}
               className="text-red-600"
              >
               <Trash2 className="w-4 h-4 mr-2" />
               Supprimer
              </DropdownMenuItem>
             </DropdownMenuContent>
            </DropdownMenu>
           </td>
          </tr>
         ))}
        </tbody>
       </table>
      </div>
     )}
    </TabsContent>

    <TabsContent value="companies">
     <CompaniesClient />
    </TabsContent>
   </Tabs>
  </div>
 )
}
