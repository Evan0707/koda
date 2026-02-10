'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from '@/components/ui/table'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
 Plus,
 Search,
 MoreVertical,
 Pencil,
 Trash2,
 Package,
} from 'lucide-react'
import { ProductDialog, Product } from './product-dialog'
import { deleteProduct, getProducts } from '@/lib/actions/products'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useConfirm } from '@/components/confirm-dialog'

interface ProductsClientProps {
 initialProducts: Product[]
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
 const [products, setProducts] = useState<Product[]>(initialProducts)
 const [search, setSearch] = useState('')
 const [isDialogOpen, setIsDialogOpen] = useState(false)
 const [editingProduct, setEditingProduct] = useState<Product | null>(null)
 const [isPending, startTransition] = useTransition()
 const router = useRouter()
 const { confirm } = useConfirm()

 const handleSearch = async (query: string) => {
  setSearch(query)
  startTransition(async () => {
   const result = await getProducts(query)
   if (result.products) {
    setProducts(result.products as Product[])
   }
  })
 }

 const handleDelete = (id: string) => {
  confirm({
   title: 'Supprimer ce produit ?',
   description: 'Cette action est irréversible.',
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteProduct(id)
    if (result.error) {
     toast.error(result.error)
    } else {
     toast.success('Produit supprimé')
     const updated = await getProducts(search)
     if (updated.products) setProducts(updated.products as Product[])
     router.refresh()
    }
   }
  })
 }

 const openCreate = () => {
  setEditingProduct(null)
  setIsDialogOpen(true)
 }

 const openEdit = (product: Product) => {
  setEditingProduct(product)
  setIsDialogOpen(true)
 }

 const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('fr-FR', {
   style: 'currency',
   currency: 'EUR',
  }).format(cents / 100)
 }

 const getUnitLabel = (unit: string | null) => {
  switch (unit) {
   case 'day': return 'Jour'
   case 'hour': return 'Heure'
   case 'fixed': return 'Forfait'
   case 'month': return 'Mois'
   case 'year': return 'An'
   default: return 'Pièce'
  }
 }

 return (
  <div className="space-y-6 animate-fade-in">
   <div className="flex items-center justify-between">
    <div>
     <h1 className="text-2xl font-bold text-foreground">Produits & Services</h1>
     <p className="text-muted-foreground">Gérez votre catalogue</p>
    </div>
    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
     <Plus className="w-4 h-4 mr-2" />
     Nouveau produit
    </Button>
   </div>

   <div className="flex items-center gap-4">
    <div className="relative flex-1 max-w-sm">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
     <Input
      placeholder="Rechercher un produit..."
      value={search}
      onChange={(e) => handleSearch(e.target.value)}
      className="pl-10"
     />
    </div>
   </div>

   <div className="bg-card rounded-lg border overflow-hidden">
    {products.length === 0 ? (
     <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">Aucun produit</h3>
      <p className="mb-4">Commencez par ajouter des produits à votre catalogue.</p>
      <Button onClick={openCreate} variant="outline">Créer un produit</Button>
     </div>
    ) : (
     <Table>
      <TableHeader className="bg-muted/50">
       <TableRow>
        <TableHead>Nom</TableHead>
        <TableHead>Prix Unitaire</TableHead>
        <TableHead>Unité</TableHead>
        <TableHead>TVA</TableHead>
        <TableHead className="w-10"></TableHead>
       </TableRow>
      </TableHeader>
      <TableBody>
       {products.map((product) => (
        <TableRow key={product.id}>
         <TableCell>
          <div className="font-medium text-foreground">{product.name}</div>
          {product.description && (
           <div className="text-xs text-muted-foreground truncate max-w-xs">
            {product.description}
           </div>
          )}
         </TableCell>
         <TableCell className="font-medium">
          {formatPrice(product.unitPrice)}
         </TableCell>
         <TableCell>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
           {getUnitLabel(product.unit)}
          </span>
         </TableCell>
         <TableCell>{product.vatRate}%</TableCell>
         <TableCell>
          <DropdownMenu>
           <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
             <MoreVertical className="w-4 h-4" />
            </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(product)}>
             <Pencil className="w-4 h-4 mr-2" />
             Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
             onClick={() => handleDelete(product.id)}
             className="text-red-600 focus:text-red-700"
            >
             <Trash2 className="w-4 h-4 mr-2" />
             Supprimer
            </DropdownMenuItem>
           </DropdownMenuContent>
          </DropdownMenu>
         </TableCell>
        </TableRow>
       ))}
      </TableBody>
     </Table>
    )}
   </div>

   <ProductDialog
    open={isDialogOpen}
    onOpenChange={setIsDialogOpen}
    product={editingProduct}
    onSuccess={async () => {
     const result = await getProducts(search)
     if (result.products) setProducts(result.products as Product[])
     router.refresh()
    }}
   />
  </div>
 )
}
