'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from '@/components/ui/dialog'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
 FileText,
 Plus,
 Search,
 MoreVertical,
 Pencil,
 Trash2,
 Send,
 CheckCircle,
 Clock,
 XCircle,
 FileSignature,
 Copy,
 Eye,
 Loader2,
 Building2,
 User,
 Calendar,
 LayoutTemplate,
} from 'lucide-react'
import {
 getContracts,
 createContract,
 updateContractStatus,
 deleteContract,
 getContractTemplates,
 createContractTemplate,
 updateContractTemplate,
 deleteContractTemplate,
} from '@/lib/actions/contracts'
import { getTemplateVariables, ContractFormData } from '@/lib/contracts-definitions'
import { useConfirm } from '@/components/confirm-dialog'
import Link from 'next/link'

type Contract = {
 id: string
 title: string
 content: string
 status: string | null
 version: number | null
 signedAt: Date | null
 effectiveDate: Date | null
 expirationDate: Date | null
 createdAt: Date
 company: { id: string; name: string } | null
 contact: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null
 template: { id: string; name: string } | null
}

type Template = {
 id: string
 name: string
 description: string | null
 content: string
 category: string | null
 createdAt: Date
}

type Company = {
 id: string
 name: string
}

type Contact = {
 id: string
 firstName: string | null
 lastName: string | null
 email: string | null
 companyId: string | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
 draft: { label: 'Brouillon', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: Clock },
 sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Send },
 signed: { label: 'Signé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
 expired: { label: 'Expiré', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
 cancelled: { label: 'Annulé', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: XCircle },
}

const categoryLabels: Record<string, string> = {
 nda: 'NDA',
 freelance: 'Freelance',
 service: 'Prestation',
 custom: 'Personnalisé',
}

export default function ContractsClient({
 initialContracts,
 templates: initialTemplates,
 companies,
 contacts,
}: {
 initialContracts: Contract[]
 templates: Template[]
 companies: Company[]
 contacts: Contact[]
}) {
 const [contracts, setContracts] = useState<Contract[]>(initialContracts)
 const [templates, setTemplates] = useState<Template[]>(initialTemplates)
 const [search, setSearch] = useState('')
 const [statusFilter, setStatusFilter] = useState('all')
 const [activeTab, setActiveTab] = useState('contracts')
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

 // Contract dialog
 const [isContractDialogOpen, setIsContractDialogOpen] = useState(false)
 const [contractForm, setContractForm] = useState<ContractFormData>({
  title: '',
  content: '',
 })

 // Template dialog
 const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
 const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

 const variables = getTemplateVariables()

 // Load data
 const loadContracts = async () => {
  const result = await getContracts(search, statusFilter)
  if (!('error' in result)) {
   setContracts(result.contracts as Contract[])
  }
 }

 const loadTemplates = async () => {
  const result = await getContractTemplates()
  if (!('error' in result)) {
   setTemplates(result.templates as Template[])
  }
 }

 // Filter contracts
 const filteredContracts = contracts.filter(c => {
  const matchesSearch = !search ||
   c.title.toLowerCase().includes(search.toLowerCase()) ||
   c.company?.name.toLowerCase().includes(search.toLowerCase())
  const matchesStatus = statusFilter === 'all' || c.status === statusFilter
  return matchesSearch && matchesStatus
 })

 // Create contract
 const handleCreateContract = async () => {
  if (!contractForm.title || !contractForm.content) {
   toast.error('Titre et contenu requis')
   return
  }

  startTransition(async () => {
   const result = await createContract(contractForm)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Contrat créé')
    setIsContractDialogOpen(false)
    setContractForm({ title: '', content: '' })
    loadContracts()
   }
  })
 }

 // Use template
 const handleUseTemplate = (template: Template) => {
  setContractForm({
   title: template.name,
   content: template.content,
   templateId: template.id,
  })
  setIsContractDialogOpen(true)
 }

 // Update status
 const handleUpdateStatus = async (id: string, status: string) => {
  startTransition(async () => {
   const result = await updateContractStatus(id, status)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Statut mis à jour')
    loadContracts()
   }
  })
 }

 // Delete contract
 const handleDeleteContract = (id: string) => {
  confirm({
   title: 'Supprimer ce contrat ?',
   description: 'Cette action est irréversible.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteContract(id)
    if (result.error) {
     toast.error(result.error)
    } else {
     toast.success('Contrat supprimé')
     loadContracts()
    }
   }
  })
 }

 // Template CRUD
 const handleSaveTemplate = async (formData: FormData) => {
  startTransition(async () => {
   let result
   if (editingTemplate) {
    result = await updateContractTemplate(editingTemplate.id, formData)
   } else {
    result = await createContractTemplate(formData)
   }

   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success(editingTemplate ? 'Modèle modifié' : 'Modèle créé')
    setIsTemplateDialogOpen(false)
    setEditingTemplate(null)
    loadTemplates()
   }
  })
 }

 const handleDeleteTemplate = (id: string) => {
  confirm({
   title: 'Supprimer ce modèle ?',
   description: 'Cette action est irréversible.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteContractTemplate(id)
    if (result.error) {
     toast.error(result.error)
    } else {
     toast.success('Modèle supprimé')
     loadTemplates()
    }
   }
  })
 }

 return (
  <div className="space-y-6 animate-fade-in">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-foreground">Contrats</h1>
     <p className="text-muted-foreground">Gérez vos contrats et modèles</p>
    </div>
    <Button
     onClick={() => setIsContractDialogOpen(true)}
     className="bg-primary hover:bg-primary/90"
    >
     <Plus className="w-4 h-4 mr-2" />
     Nouveau contrat
    </Button>
   </div>

   <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="bg-muted">
     <TabsTrigger value="contracts" className="data-[state=active]:bg-card">
      <FileSignature className="w-4 h-4 mr-2" />
      Contrats
     </TabsTrigger>
     <TabsTrigger value="templates" className="data-[state=active]:bg-card">
      <LayoutTemplate className="w-4 h-4 mr-2" />
      Modèles
     </TabsTrigger>
    </TabsList>

    {/* Contracts Tab */}
    <TabsContent value="contracts" className="space-y-4">
     {/* Filters */}
     <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
       <Input
        placeholder="Rechercher un contrat..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10"
       />
      </div>
      <select
       value={statusFilter}
       onChange={(e) => setStatusFilter(e.target.value)}
       className="h-9 px-3 rounded-md border bg-background text-sm"
      >
       <option value="all">Tous les statuts</option>
       <option value="draft">Brouillons</option>
       <option value="sent">Envoyés</option>
       <option value="signed">Signés</option>
       <option value="expired">Expirés</option>
      </select>
     </div>

     {/* Contracts Grid */}
     {filteredContracts.length === 0 ? (
      <Card>
       <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileSignature className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun contrat</h3>
        <p className="text-gray-500 mb-4">Créez votre premier contrat ou utilisez un modèle</p>
        <div className="flex gap-2">
         <Button onClick={() => setIsContractDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau contrat
         </Button>
         <Button variant="outline" onClick={() => setActiveTab('templates')}>
          Voir les modèles
         </Button>
        </div>
       </CardContent>
      </Card>
     ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {filteredContracts.map((contract) => {
        const status = statusConfig[contract.status || 'draft']
        const StatusIcon = status.icon
        return (
         <Card key={contract.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
           <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
             <CardTitle className="text-lg truncate">{contract.title}</CardTitle>
             <div className="flex items-center gap-2 mt-1">
              {contract.company && (
               <span className="text-sm text-gray-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {contract.company.name}
               </span>
              )}
             </div>
            </div>
            <DropdownMenu>
             <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
               <MoreVertical className="w-4 h-4" />
              </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
               <Link href={`/dashboard/contracts/${contract.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                Voir
               </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
               <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
               </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {contract.status === 'draft' && (
               <DropdownMenuItem onClick={() => handleUpdateStatus(contract.id, 'sent')}>
                <Send className="w-4 h-4 mr-2" />
                Marquer envoyé
               </DropdownMenuItem>
              )}
              {contract.status === 'sent' && (
               <DropdownMenuItem onClick={() => handleUpdateStatus(contract.id, 'signed')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Marquer signé
               </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
               onClick={() => handleDeleteContract(contract.id)}
               className="text-red-600"
              >
               <Trash2 className="w-4 h-4 mr-2" />
               Supprimer
              </DropdownMenuItem>
             </DropdownMenuContent>
            </DropdownMenu>
           </div>
          </CardHeader>
          <CardContent>
           <div className="space-y-3">
            <Badge className={status.color}>
             <StatusIcon className="w-3 h-3 mr-1" />
             {status.label}
            </Badge>

            {contract.contact && (
             <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-3 h-3" />
              {contract.contact.firstName} {contract.contact.lastName}
             </div>
            )}

            {contract.effectiveDate && (
             <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-3 h-3" />
              Effectif le {new Date(contract.effectiveDate).toLocaleDateString('fr-FR')}
             </div>
            )}

            <div className="text-xs text-gray-400">
             Créé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}
            </div>
           </div>
          </CardContent>
         </Card>
        )
       })}
      </div>
     )}
    </TabsContent>

    {/* Templates Tab */}
    <TabsContent value="templates" className="space-y-4">
     <div className="flex items-center justify-between">
      <p className="text-gray-500">Modèles de contrats réutilisables</p>
      <Button onClick={() => { setEditingTemplate(null); setIsTemplateDialogOpen(true); }}>
       <Plus className="w-4 h-4 mr-2" />
       Nouveau modèle
      </Button>
     </div>

     {templates.length === 0 ? (
      <Card>
       <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <LayoutTemplate className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun modèle</h3>
        <p className="text-gray-500 mb-4">Créez des modèles pour générer des contrats rapidement</p>
        <Button onClick={() => setIsTemplateDialogOpen(true)}>
         <Plus className="w-4 h-4 mr-2" />
         Créer un modèle
        </Button>
       </CardContent>
      </Card>
     ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       {templates.map((template) => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
         <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
           <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.category && (
             <Badge variant="outline" className="mt-1">
              {categoryLabels[template.category] || template.category}
             </Badge>
            )}
           </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
             </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => handleUseTemplate(template)}>
              <Copy className="w-4 h-4 mr-2" />
              Utiliser
             </DropdownMenuItem>
             <DropdownMenuItem onClick={() => { setEditingTemplate(template); setIsTemplateDialogOpen(true); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem
              onClick={() => handleDeleteTemplate(template.id)}
              className="text-red-600"
             >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
             </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
          </div>
         </CardHeader>
         <CardContent>
          {template.description && (
           <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
          )}
          <Button
           variant="outline"
           size="sm"
           className="mt-4 w-full"
           onClick={() => handleUseTemplate(template)}
          >
           <FileText className="w-4 h-4 mr-2" />
           Créer un contrat
          </Button>
         </CardContent>
        </Card>
       ))}
      </div>
     )}
    </TabsContent>
   </Tabs>

   {/* New Contract Dialog */}
   <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>Nouveau contrat</DialogTitle>
      <DialogDescription>
       Créez un nouveau contrat ou personnalisez un modèle
      </DialogDescription>
     </DialogHeader>

     <div className="space-y-4">
      <div className="space-y-2">
       <Label htmlFor="title">Titre du contrat</Label>
       <Input
        id="title"
        value={contractForm.title}
        onChange={(e) => setContractForm(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Ex: Contrat de prestation - Client ABC"
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label htmlFor="companyId">Entreprise</Label>
        <select
         id="companyId"
         value={contractForm.companyId || ''}
         onChange={(e) => setContractForm(prev => ({ ...prev, companyId: e.target.value }))}
         className="w-full h-9 px-3 rounded-md border bg-background text-sm"
        >
         <option value="">Sélectionner...</option>
         {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
         ))}
        </select>
       </div>
       <div className="space-y-2">
        <Label htmlFor="contactId">Contact</Label>
        <select
         id="contactId"
         value={contractForm.contactId || ''}
         onChange={(e) => setContractForm(prev => ({ ...prev, contactId: e.target.value }))}
         className="w-full h-9 px-3 rounded-md border bg-background text-sm"
        >
         <option value="">Sélectionner...</option>
         {contacts.map(c => (
          <option key={c.id} value={c.id}>
           {c.firstName} {c.lastName}
          </option>
         ))}
        </select>
       </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label htmlFor="effectiveDate">Date d'effet</Label>
        <Input
         id="effectiveDate"
         type="date"
         value={contractForm.effectiveDate || ''}
         onChange={(e) => setContractForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
        />
       </div>
       <div className="space-y-2">
        <Label htmlFor="expirationDate">Date d'expiration</Label>
        <Input
         id="expirationDate"
         type="date"
         value={contractForm.expirationDate || ''}
         onChange={(e) => setContractForm(prev => ({ ...prev, expirationDate: e.target.value }))}
        />
       </div>
      </div>

      <div className="space-y-2">
       <div className="flex items-center justify-between">
        <Label htmlFor="content">Contenu</Label>
        <DropdownMenu>
         <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
           Insérer variable
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent>
          {variables.map(v => (
           <DropdownMenuItem
            key={v.key}
            onClick={() => setContractForm(prev => ({
             ...prev,
             content: prev.content + v.key
            }))}
           >
            <span className="font-mono text-xs mr-2">{v.key}</span>
            <span className="text-gray-500">{v.label}</span>
           </DropdownMenuItem>
          ))}
         </DropdownMenuContent>
        </DropdownMenu>
       </div>
       <Textarea
        id="content"
        value={contractForm.content}
        onChange={(e) => setContractForm(prev => ({ ...prev, content: e.target.value }))}
        placeholder="Contenu du contrat..."
        className="min-h-[300px] font-mono text-sm"
       />
      </div>

      <div className="flex justify-end gap-2">
       <Button variant="ghost" onClick={() => setIsContractDialogOpen(false)}>
        Annuler
       </Button>
       <Button onClick={handleCreateContract} disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        Créer le contrat
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>

   {/* Template Dialog */}
   <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}</DialogTitle>
      <DialogDescription>
       Les modèles permettent de créer des contrats rapidement
      </DialogDescription>
     </DialogHeader>

     <form action={handleSaveTemplate} className="space-y-4">
      <div className="space-y-2">
       <Label htmlFor="name">Nom du modèle</Label>
       <Input
        id="name"
        name="name"
        defaultValue={editingTemplate?.name}
        placeholder="Ex: Contrat de prestation standard"
        required
       />
      </div>

      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <select
         id="category"
         name="category"
         defaultValue={editingTemplate?.category || 'custom'}
         className="w-full h-9 px-3 rounded-md border bg-background text-sm"
        >
         <option value="nda">NDA</option>
         <option value="freelance">Freelance</option>
         <option value="service">Prestation de service</option>
         <option value="custom">Personnalisé</option>
        </select>
       </div>
       <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
         id="description"
         name="description"
         defaultValue={editingTemplate?.description || ''}
         placeholder="Description courte..."
        />
       </div>
      </div>

      <div className="space-y-2">
       <div className="flex items-center justify-between">
        <Label htmlFor="templateContent">Contenu du modèle</Label>
        <span className="text-xs text-gray-500">Utilisez les variables pour personnaliser</span>
       </div>
       <div className="flex flex-wrap gap-1 mb-2">
        {variables.map(v => (
         <Badge key={v.key} variant="outline" className="text-xs cursor-pointer hover:bg-gray-100">
          {v.key}
         </Badge>
        ))}
       </div>
       <Textarea
        id="templateContent"
        name="content"
        defaultValue={editingTemplate?.content}
        placeholder="Contenu du modèle avec variables..."
        className="min-h-[300px] font-mono text-sm"
        required
       />
      </div>

      <div className="flex justify-end gap-2">
       <Button type="button" variant="ghost" onClick={() => setIsTemplateDialogOpen(false)}>
        Annuler
       </Button>
       <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {editingTemplate ? 'Modifier' : 'Créer'}
       </Button>
      </div>
     </form>
    </DialogContent>
   </Dialog>
  </div>
 )
}
