'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  FileSignature,
  Copy,
  Eye,
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
import { ContractFormData } from '@/lib/contracts-definitions'
import { useConfirm } from '@/components/confirm-dialog'
import { SearchInput } from '@/components/search-input'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import Link from 'next/link'
import type { Contract, Template, Company, Contact } from './contracts-types'
import { statusConfig, categoryLabels } from './contracts-types'
import { ContractDialog } from './contract-dialog'
import { TemplateDialog } from './template-dialog'

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

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  const handleUseTemplate = (template: Template) => {
    setContractForm({
      title: template.name,
      content: template.content,
      templateId: template.id,
    })
    setIsContractDialogOpen(true)
  }

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
          <div className="flex items-center gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un contrat..."
            />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'draft', label: 'Brouillons' },
                { value: 'sent', label: 'Envoyés' },
                { value: 'signed', label: 'Signés' },
                { value: 'expired', label: 'Expirés' },
              ]}
            />
          </div>

          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={FileSignature}
                  title="Aucun contrat"
                  description="Créez votre premier contrat ou utilisez un modèle"
                  action={{ label: 'Nouveau contrat', onClick: () => setIsContractDialogOpen(true) }}
                  secondaryAction={{ label: 'Voir les modèles', onClick: () => setActiveTab('templates') }}
                />
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
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            {contract.contact.firstName} {contract.contact.lastName}
                          </div>
                        )}
                        {contract.effectiveDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            Effectif le {new Date(contract.effectiveDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/70">
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
            <p className="text-muted-foreground">Modèles de contrats réutilisables</p>
            <Button onClick={() => { setEditingTemplate(null); setIsTemplateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </div>

          {templates.length === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={LayoutTemplate}
                  title="Aucun modèle"
                  description="Créez des modèles pour générer des contrats rapidement"
                  action={{ label: 'Créer un modèle', onClick: () => setIsTemplateDialogOpen(true) }}
                />
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
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
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

      {/* Dialogs */}
      <ContractDialog
        isOpen={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
        contractForm={contractForm}
        onFormChange={setContractForm}
        companies={companies}
        contacts={contacts}
        isPending={isPending}
        onSubmit={handleCreateContract}
      />

      <TemplateDialog
        isOpen={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        editingTemplate={editingTemplate}
        isPending={isPending}
        onSubmit={handleSaveTemplate}
      />
    </div>
  )
}
