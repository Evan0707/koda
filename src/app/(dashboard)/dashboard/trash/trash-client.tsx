'use client'

import { useState, useTransition } from 'react'
import { PageHeader } from '@/components/page-header'
import { Trash2, ArchiveRestore, Building2, User, FileText, Receipt, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { ArchiveItem, restoreItem, deleteItemPermanently, emptyTrash } from '@/lib/actions/archive'
import { toast } from 'sonner'
import { useConfirm } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'

export default function TrashClient({ initialItems }: { initialItems: ArchiveItem[] }) {
 const [items, setItems] = useState<ArchiveItem[]>(initialItems)
 const [isPending, startTransition] = useTransition()
 const { confirm } = useConfirm()

 const handleRestore = (item: ArchiveItem) => {
  startTransition(async () => {
   const result = await restoreItem(item.type, item.id)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Élément restauré avec succès')
    setItems(items.filter(i => i.id !== item.id))
   }
  })
 }

 const handleDeletePermanently = (item: ArchiveItem) => {
  confirm({
   title: 'Supprimer définitivement ?',
   description: 'Cette action est irréversible. L\'élément sera effacé de la base de données.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteItemPermanently(item.type, item.id)
    if (result.error) {
     toast.error(result.error)
    } else {
     toast.success('Élément supprimé définitivement')
     setItems(items.filter(i => i.id !== item.id))
    }
   }
  })
 }

 const handleEmptyTrash = () => {
  confirm({
   title: 'Vider la corbeille ?',
   description: 'Êtes-vous sûr de vouloir supprimer définitivement tous les éléments de la corbeille ? Cette action est irréversible.',
   confirmText: 'Vider la corbeille',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await emptyTrash()
    if (result.error) {
     toast.error(result.error)
    } else {
     toast.success('Corbeille vidée avec succès')
     setItems([])
    }
   }
  })
 }

 const getTypeIcon = (type: string) => {
  switch (type) {
   case 'company': return <Building2 className="w-4 h-4 text-blue-500" />
   case 'contact': return <User className="w-4 h-4 text-emerald-500" />
   case 'quote': return <FileText className="w-4 h-4 text-purple-500" />
   case 'invoice': return <Receipt className="w-4 h-4 text-amber-500" />
   default: return <Trash2 className="w-4 h-4" />
  }
 }

 const getTypeLabel = (type: string) => {
  switch (type) {
   case 'company': return 'Entreprise'
   case 'contact': return 'Contact'
   case 'quote': return 'Devis'
   case 'invoice': return 'Facture'
   default: return type
  }
 }

 const columns: ColumnDef<ArchiveItem>[] = [
  {
   accessorKey: 'type',
   header: 'Type',
   cell: ({ row }) => (
    <div className="flex items-center gap-2">
     {getTypeIcon(row.original.type)}
     <span className="capitalize">{getTypeLabel(row.original.type)}</span>
    </div>
   )
  },
  {
   accessorKey: 'name',
   header: 'Nom / Référence',
   cell: ({ row }) => (
    <div className="font-medium">{row.original.name}</div>
   )
  },
  {
   accessorKey: 'deletedAt',
   header: 'Supprimé le',
   cell: ({ row }) => {
    const date = new Date(row.original.deletedAt)
    return date.toLocaleDateString('fr-FR', {
     day: '2-digit',
     month: 'long',
     year: 'numeric'
    })
   }
  },
  {
   accessorKey: 'daysRemaining',
   header: 'Jours restants',
   cell: ({ row }) => {
    const days = row.original.daysRemaining
    return (
     <Badge variant={days <= 5 ? 'destructive' : 'secondary'}>
      {days} jour{days > 1 ? 's' : ''}
     </Badge>
    )
   }
  },
  {
   id: 'actions',
   cell: ({ row }) => {
    const item = row.original
    return (
     <div className="flex justify-end gap-2">
      <Button
       variant="outline"
       size="sm"
       onClick={() => handleRestore(item)}
       disabled={isPending}
       className="hover:text-emerald-600 hover:bg-emerald-50"
      >
       <ArchiveRestore className="w-4 h-4 mr-2" />
       Restaurer
      </Button>
      <Button
       variant="ghost"
       size="sm"
       onClick={() => handleDeletePermanently(item)}
       disabled={isPending}
       className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
       <Trash2 className="w-4 h-4" />
      </Button>
     </div>
    )
   }
  }
 ]

 return (
  <div className="space-y-6 animate-fade-in">
   <PageHeader
    title="Corbeille"
    description="Les éléments supprimés sont conservés ici pendant 30 jours avant d'être supprimés définitivement."
    icon={Trash2}
    actions={
     items.length > 0 && (
      <Button
       variant="destructive"
       onClick={handleEmptyTrash}
       disabled={isPending}
      >
       <Trash2 className="w-4 h-4 mr-2" />
       Vider la corbeille
      </Button>
     )
    }
   />

   {items.length === 0 ? (
    <Card>
     <CardContent>
      <EmptyState
       icon={Trash2}
       title="La corbeille est vide"
       description="Aucun élément n'a été supprimé récemment."
      />
     </CardContent>
    </Card>
   ) : (
    <div className="bg-card rounded-lg overflow-hidden border">
     <DataTable columns={columns} data={items} />
    </div>
   )}
  </div>
 )
}
