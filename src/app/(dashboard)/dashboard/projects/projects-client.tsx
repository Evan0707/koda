'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
 FolderKanban,
 Plus,
 MoreVertical,
 Pencil,
 Trash2,
 Loader2,
 Calendar,
 Building2,
 CheckCircle2,
 Clock,
 Pause,
 XCircle,
 UserCircle,
} from 'lucide-react'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getProjects, createProject, updateProject, deleteProject, ProjectFormData } from '@/lib/actions/projects'
import { getCompanies } from '@/lib/actions/companies'
import { getUsers } from '@/lib/actions/users'
import { Project, Company } from '@/types/db'
import { useEffect } from 'react'
import { useConfirm } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { SearchInput } from '@/components/search-input'
import { FilterSelect } from '@/components/filter-select'
import { EmptyState } from '@/components/empty-state'
import { formatPrice } from '@/lib/currency'

type ProjectWithCompany = Project & {
 company: Company | null
 owner: { id: string; firstName: string | null; lastName: string | null } | null
 manager: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
 active: { label: 'Actif', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <Clock className="w-3 h-3" /> },
 paused: { label: 'En pause', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: <Pause className="w-3 h-3" /> },
 completed: { label: 'Terminé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: <CheckCircle2 className="w-3 h-3" /> },
 cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: <XCircle className="w-3 h-3" /> },
}

export default function ProjectsClient({ initialProjects }: { initialProjects: ProjectWithCompany[] }) {
 const [projects, setProjects] = useState<ProjectWithCompany[]>(initialProjects)
 const [companies, setCompanies] = useState<Company[]>([])
 const [users, setUsers] = useState<{ id: string; firstName: string | null; lastName: string | null }[]>([])
 const [search, setSearch] = useState('')
 const [statusFilter, setStatusFilter] = useState('all')
 const [isLoading, setIsLoading] = useState(false)
 const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [editingProject, setEditingProject] = useState<Project | null>(null)
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

 // Load companies and users for the form
 useEffect(() => {
  getCompanies().then(res => {
   if (res.companies) setCompanies(res.companies as Company[])
  })
  getUsers().then(res => {
   if (res.users) setUsers(res.users)
  })
 }, [])

 // Reload projects when filters change
 useEffect(() => {
  const loadProjects = async () => {
   setIsLoading(true)
   const res = await getProjects(search || undefined, statusFilter !== 'all' ? statusFilter : undefined)
   if (res.projects) setProjects(res.projects as ProjectWithCompany[])
   setIsLoading(false)
  }

  const debounce = setTimeout(loadProjects, 300)
  return () => clearTimeout(debounce)
 }, [search, statusFilter])

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)

  const data: ProjectFormData = {
   name: formData.get('name') as string,
   description: formData.get('description') as string || undefined,
   companyId: (formData.get('companyId') as string) === 'no-client' ? null : (formData.get('companyId') as string || null),
   managerId: (formData.get('managerId') as string) === 'no-manager' ? null : (formData.get('managerId') as string || null),
   status: (formData.get('status') as any) || 'active',
   budgetType: (formData.get('budgetType') as any) || 'fixed',
   budgetAmount: formData.get('budgetAmount') ? Number(formData.get('budgetAmount')) : undefined,
   startDate: formData.get('startDate') as string || undefined,
   endDate: formData.get('endDate') as string || undefined,
  }

  startTransition(async () => {
   let result
   if (editingProject) {
    result = await updateProject(editingProject.id, data)
   } else {
    result = await createProject(data)
   }

   if ('error' in result) {
    toast.error(result.error)
   } else {
    toast.success(editingProject ? 'Projet modifié' : 'Projet créé')
    setIsDialogOpen(false)
    setEditingProject(null)
    // Reload
    const res = await getProjects()
    if (res.projects) setProjects(res.projects as ProjectWithCompany[])
   }
  })
 }

 const handleDelete = (id: string) => {
  confirm({
   title: 'Supprimer ce projet ?',
   description: 'Cette action supprimera le projet et toutes ses tâches associées.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteProject(id)
    if ('error' in result) {
     toast.error(result.error)
    } else {
     toast.success('Projet supprimé')
     setProjects(projects.filter(p => p.id !== id))
    }
   }
  })
 }

 const openEdit = (project: Project) => {
  setEditingProject(project)
  setIsDialogOpen(true)
 }

 const formatDate = (date: string | null) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
 }

 return (
  <div className="space-y-6 animate-fade-in">
   {/* Header */}
   <PageHeader
    title="Projets"
    description="Gérez vos projets et suivez leur avancement"
    icon={FolderKanban}
    actions={
     <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open)
      if (!open) setEditingProject(null)
     }}>
      <DialogTrigger asChild>
       <Button className="bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4 mr-2" />
        Nouveau projet
       </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
       <DialogHeader>
        <DialogTitle>
         {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
        </DialogTitle>
       </DialogHeader>
       <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
         <Label>Nom du projet *</Label>
         <Input
          name="name"
          placeholder="Ex: Refonte site web"
          defaultValue={editingProject?.name || ''}
          required
         />
        </div>

        <div className="space-y-2">
         <Label>Description</Label>
         <Textarea
          name="description"
          placeholder="Description du projet..."
          defaultValue={editingProject?.description || ''}
          rows={3}
         />
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label>Client (Optionnel)</Label>
          <Select name="companyId" defaultValue={editingProject?.companyId || 'no-client'}>
           <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un client" />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="no-client">Aucun</SelectItem>
            {companies.map((company) => (
             <SelectItem key={company.id} value={company.id}>
              {company.name}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </div>
         <div className="space-y-2">
          <Label>Responsable (Optionnel)</Label>
          <Select name="managerId" defaultValue={editingProject?.managerId || 'no-manager'}>
           <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un responsable" />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="no-manager">Aucun</SelectItem>
            {users.map((user) => (
             <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
             </SelectItem>
            ))}
           </SelectContent>
          </Select>
         </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label>Statut</Label>
          <Select name="status" defaultValue={editingProject?.status || 'active'}>
           <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un statut" />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="completed">Terminé</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
           </SelectContent>
          </Select>
         </div>
         <div className="space-y-2">
          <Label>Type de budget</Label>
          <Select name="budgetType" defaultValue={editingProject?.budgetType || 'fixed'}>
           <SelectTrigger className="w-full">
            <SelectValue placeholder="Type de budget" />
           </SelectTrigger>
           <SelectContent>
            <SelectItem value="fixed">Forfait</SelectItem>
            <SelectItem value="hourly">À l'heure</SelectItem>
            <SelectItem value="retainer">Abonnement</SelectItem>
           </SelectContent>
          </Select>
         </div>
        </div>

        <div className="space-y-2">
         <Label>Budget (€)</Label>
         <Input
          name="budgetAmount"
          type="number"
          step="0.01"
          placeholder="0.00"
          defaultValue={editingProject?.budgetAmount ? editingProject.budgetAmount / 100 : ''}
         />
        </div>

        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <Label>Date de début</Label>
          <Input
           name="startDate"
           type="date"
           defaultValue={editingProject?.startDate || ''}
          />
         </div>
         <div className="space-y-2">
          <Label>Date de fin</Label>
          <Input
           name="endDate"
           type="date"
           defaultValue={editingProject?.endDate || ''}
          />
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
          className="bg-primary hover:bg-primary/90"
         >
          {isPending ? (
           <Loader2 className="w-4 h-4 animate-spin" />
          ) : editingProject ? 'Modifier' : 'Créer'}
         </Button>
        </div>
       </form>
      </DialogContent>
     </Dialog>
    }
   />

   {/* Filters */}
   <div className="flex items-center gap-4">
    <SearchInput
     value={search}
     onChange={setSearch}
     placeholder="Rechercher un projet..."
    />
    <FilterSelect
     value={statusFilter}
     onChange={setStatusFilter}
     options={[
      { value: 'all', label: 'Tous les statuts' },
      { value: 'active', label: 'Actifs' },
      { value: 'paused', label: 'En pause' },
      { value: 'completed', label: 'Terminés' },
      { value: 'cancelled', label: 'Annulés' },
     ]}
     className="w-40"
    />
   </div>

   {/* Projects Grid */}
   {
    isLoading ? (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
       <Card key={i} className="h-[200px]">
        <CardContent className="p-5 space-y-4">
         <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-8" />
         </div>
         <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
         </div>
         <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
         </div>
         <div className="flex gap-4 pt-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
         </div>
        </CardContent>
       </Card>
      ))}
     </div>
    ) : projects.length === 0 ? (
     <Card>
      <CardContent>
       <EmptyState
        icon={FolderKanban}
        title="Aucun projet"
        description="Créez votre premier projet pour commencer"
        action={{ label: 'Créer un projet', onClick: () => setIsDialogOpen(true) }}
       />
      </CardContent>
     </Card>
    ) : (
     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
       const status = statusConfig[project.status || 'active']
       return (
        <Card
         key={project.id}
         className="hover:border-primary/50 transition-colors group"
        >
         <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
           <Link
            href={`/dashboard/projects/${project.id}`}
            className="flex-1"
           >
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
             {project.name}
            </h3>
           </Link>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
             </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
             <DropdownMenuItem onClick={() => openEdit(project)}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier
             </DropdownMenuItem>
             <DropdownMenuItem
              onClick={() => handleDelete(project.id)}
              className="text-red-600"
             >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
             </DropdownMenuItem>
            </DropdownMenuContent>
           </DropdownMenu>
          </div>

          {project.description && (
           <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
           </p>
          )}

          <div className="flex items-center gap-2 mb-3 flex-wrap">
           <Badge className={`${status.color} flex items-center gap-1`}>
            {status.icon}
            {status.label}
           </Badge>
           {project.budgetAmount && (
            <Badge variant="outline">
             {formatPrice(project.budgetAmount!, 'EUR')}
            </Badge>
           )}
           {project.manager && (
            <Badge variant="secondary" className="flex items-center gap-1">
             <UserCircle className="w-3 h-3" />
             {project.manager.firstName}
            </Badge>
           )}
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
           {project.company && (
            <span className="flex items-center gap-1">
             <Building2 className="w-3 h-3" />
             {project.company.name}
            </span>
           )}
           {project.startDate && (
            <span className="flex items-center gap-1">
             <Calendar className="w-3 h-3" />
             {formatDate(project.startDate)}
            </span>
           )}
          </div>

          {/* Progress bar */}
          {project.progress !== null && project.progress > 0 && (
           <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
             <span className="text-muted-foreground">Progression</span>
             <span className="font-medium">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
             <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
             />
            </div>
           </div>
          )}
         </CardContent>
        </Card>
       )
      })}
     </div>
    )
   }
  </div >
 )
}
