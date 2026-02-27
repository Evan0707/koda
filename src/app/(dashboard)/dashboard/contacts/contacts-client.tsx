'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import Link from 'next/link'
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
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Loader2,
  User,
  Upload,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/actions/contacts'
import { getCompanies } from '@/lib/actions/companies'
import { getTags } from '@/lib/actions/tags'
import CompaniesClient from './companies-client'
import { Contact, Company } from '@/types/db'
import { useConfirm } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { LimitReachedModal } from '@/components/limit-reached-modal'
import { SearchInput } from '@/components/search-input'
import { EmptyState } from '@/components/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { TagInput } from '@/components/ui/tag-input'
import { Badge } from '@/components/ui/badge'

type Tag = {
  id: string
  name: string
  color: string | null
}

type ContactWithCompany = Contact & {
  company: Company | null
  taggables: { tag: Tag }[]
}

export default function ContactsClient() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('contacts')
  const [companyFilter, setCompanyFilter] = useState('all')
  const { confirm } = useConfirm()
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('free')

  // Filter contacts by company
  const filteredContacts = useMemo(() => {
    if (companyFilter === 'all') return contacts
    if (companyFilter === 'none') return contacts.filter(c => !c.companyId)
    return contacts.filter(c => c.companyId === companyFilter)
  }, [contacts, companyFilter])

  const loadData = async () => {
    setIsLoading(true)
    const [contactsRes, companiesRes, tagsRes] = await Promise.all([
      getContacts(search || undefined),
      getCompanies(),
      getTags()
    ])
    if (contactsRes.contacts) {
      setContacts(contactsRes.contacts as unknown as ContactWithCompany[])
    }
    if (companiesRes.companies) {
      setCompanies(companiesRes.companies as Company[])
    }
    if (tagsRes.tags) {
      setAllTags(tagsRes.tags as Tag[])
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
        if ('upgradeRequired' in result && result.upgradeRequired && 'currentPlan' in result) {
          setCurrentPlan((result as any).currentPlan || 'free')
          setIsDialogOpen(false) // Close the creation dialog
          setShowLimitModal(true) // Show the limit modal
        } else {
          toast.error(result.error)
        }
      } else {
        toast.success(editingContact ? 'Contact modifié' : 'Contact créé')
        setIsDialogOpen(false)
        setEditingContact(null)
        loadData()
      }
    })
  }

  const handleDelete = (id: string) => {
    confirm({
      title: 'Supprimer ce contact ?',
      description: 'Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'destructive',
      onConfirm: async () => {
        const result = await deleteContact(id)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Contact supprimé')
          loadData()
        }
      }
    })
  }

  const openEdit = (contact: ContactWithCompany) => {
    setEditingContact(contact)
    setIsDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<ContactWithCompany>[]>(() => [
    {
      id: 'contact',
      header: 'Contact',
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/contacts/${contact.id}`}
              className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
            >
              <span className="text-sm font-medium text-primary">
                {(contact.firstName || '?')[0]}{contact.lastName?.[0] || ''}
              </span>
            </Link>
            <div>
              <Link
                href={`/dashboard/contacts/${contact.id}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {contact.firstName || ''} {contact.lastName || ''}
              </Link>
              {contact.jobTitle && (
                <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
              )}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'company.name',
      header: 'Entreprise',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.company?.name || '—'}</span>
      )
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) => {
        const contactTags = row.original.taggables?.map(t => t.tag) || []
        if (contactTags.length === 0) return <span className="text-muted-foreground/50">—</span>

        return (
          <div className="flex flex-wrap gap-1">
            {contactTags.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-5"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  color: tag.color || undefined,
                  borderColor: tag.color ? `${tag.color}40` : undefined
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )
      }
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const email = row.original.email
        return email ? (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-3.5 h-3.5" />
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )
      }
    },
    {
      accessorKey: 'phone',
      header: 'Téléphone',
      cell: ({ row }) => {
        const phone = row.original.phone
        return phone ? (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-3.5 h-3.5" />
            {phone}
          </a>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const contact = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 float-right" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(contact); }}>
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [allTags])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Contacts"
        description="Gérez vos contacts et entreprises"
        icon={Users}
        actions={
          activeTab === 'contacts' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild size="sm">
                <Link href="/dashboard/contacts/import">
                  <Upload className="w-4 h-4 mr-2" />
                  Importer
                </Link>
              </Button>
              <Button size="sm" onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau contact
              </Button>
            </div>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="contacts" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Users className="w-4 h-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="companies" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Building2 className="w-4 h-4 mr-2" />
            Entreprises
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <SearchInput
              value={search}
              onChange={setSearch}
              className="min-w-[200px]"
            />
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-[180px]">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Entreprise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="none">Sans entreprise</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingContact(null)
          }}>
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
                    <Label>Email *</Label>
                    <Input
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={editingContact?.email || ''}
                      required
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
                {editingContact && (
                  <div className="pt-2 border-t mt-4">
                    <Label className="mb-2 block">Tags</Label>
                    <TagInput
                      entityId={editingContact.id}
                      entityType="contact"
                      initialTags={allTags}
                      assignedTags={(editingContact as ContactWithCompany).taggables?.map(t => t.tag) || []}
                      onTagChange={loadData}
                    />
                  </div>
                )}
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
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingContact ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {
            isLoading ? (
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Entreprise
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Téléphone
                      </th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-4 w-28" />
                        </td>
                        <td className="px-4 py-3">
                          <Skeleton className="h-8 w-8 rounded" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filteredContacts.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={User}
                    title={contacts.length === 0 ? 'Aucun contact' : 'Aucun résultat'}
                    description={contacts.length === 0
                      ? 'Créez votre premier contact pour commencer'
                      : 'Aucun contact ne correspond à vos critères.'}
                    action={contacts.length === 0
                      ? { label: 'Créer un contact', onClick: () => setIsDialogOpen(true) }
                      : undefined}
                    secondaryAction={contacts.length > 0
                      ? { label: 'Réinitialiser les filtres', onClick: () => { setSearch(''); setCompanyFilter('all') } }
                      : undefined}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="bg-card rounded-lg overflow-hidden">
                <DataTable columns={columns} data={filteredContacts} />
              </div>
            )
          }
        </TabsContent >

        <TabsContent value="companies">
          <CompaniesClient />
        </TabsContent>
      </Tabs >
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentPlan={currentPlan}
        limitType="contacts"
      />
    </div >
  )
}
