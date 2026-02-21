'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
 Building2,
 Mail,
 Phone,
 Linkedin,
 MapPin,
 MoreHorizontal,
 Pencil,
 Trash2,
 Euro,
 Calendar,
 ArrowLeft,
 Receipt,
 FileText,
 TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Timeline } from '@/components/crm/timeline'
import { TagInput } from '@/components/ui/tag-input'
import { Separator } from '@/components/ui/separator'
import { useConfirm } from '@/components/confirm-dialog'
import { deleteContact } from '@/lib/actions/contacts'
import { toast } from 'sonner'

import { formatPrice } from '@/lib/currency'

type ContactViewProps = {
 contact: any // Typed properly in page
 activities: any[]
 opportunities: any[]
 invoices?: any[]
 quotes?: any[]
}

export default function ContactView({ contact, activities, opportunities, invoices = [], quotes = [] }: ContactViewProps) {
 const { confirm } = useConfirm()
 const router = useRouter()

 const handleDelete = () => {
  confirm({
   title: 'Supprimer le contact',
   description: `Êtes-vous sûr de vouloir supprimer ${contact.firstName} ${contact.lastName} ? Cette action est irréversible.`,
   confirmText: 'Supprimer',
   variant: 'destructive',
   onConfirm: async () => {
    const result = await deleteContact(contact.id)
    if (result?.error) {
     toast.error(result.error)
    } else {
     toast.success('Contact supprimé')
     router.push('/dashboard/contacts')
    }
   },
  })
 }

 const getInitials = (first: string, last: string | null) => {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
 }

 const formatValue = (cents: number) => {
  return new Intl.NumberFormat('fr-FR', {
   style: 'currency',
   currency: 'EUR',
   minimumFractionDigits: 0,
  }).format(cents / 100)
 }

 return (
  <div className="max-w-5xl mx-auto space-y-6">
   {/* Header */}
   <div className="flex items-center gap-4 mb-6">
    <Link
     href="/dashboard/contacts"
     className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
    >
     <ArrowLeft className="w-5 h-5" />
    </Link>
    <div className="flex-1">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
       <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
        <AvatarImage src={contact.avatarUrl} />
        <AvatarFallback className="text-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
         {getInitials(contact.firstName, contact.lastName)}
        </AvatarFallback>
       </Avatar>
       <div>
        <h1 className="text-2xl font-bold text-foreground">
         {contact.firstName} {contact.lastName}
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
         {contact.jobTitle && <span>{contact.jobTitle}</span>}
         {contact.company && (
          <>
           <span>•</span>
           <Link
            href={`/dashboard/companies/${contact.company.id}`}
            className="flex items-center gap-1 hover:text-primary hover:underline"
           >
            <Building2 className="w-3.5 h-3.5" />
            {contact.company.name}
           </Link>
          </>
         )}
        </div>
       </div>
      </div>

      <div className="flex gap-2">
       <Button variant="outline">
        <Pencil className="w-4 h-4 mr-2" />
        Modifier
       </Button>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
         </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
         <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
         </DropdownMenuItem>
        </DropdownMenuContent>
       </DropdownMenu>
      </div>
     </div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Left Column: Timeline */}
    <div className="lg:col-span-2 space-y-6">
     <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h2 className="font-semibold text-lg text-foreground mb-4">Activité</h2>
      <Timeline
       entityId={contact.id}
       entityType="contact"
       activities={activities}
      />
     </div>
    </div>

    {/* Right Column: Info & Opportunities */}
    <div className="space-y-6">
     {/* Contact Info */}
     <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
      <h3 className="font-semibold text-foreground">Coordonnées</h3>
      <div className="space-y-3 text-sm">
       {contact.email && (
        <div className="flex items-center gap-3 text-muted-foreground">
         <Mail className="w-4 h-4 text-muted-foreground" />
         <a href={`mailto:${contact.email}`} className="hover:text-foreground">
          {contact.email}
         </a>
        </div>
       )}
       {contact.phone && (
        <div className="flex items-center gap-3 text-muted-foreground">
         <Phone className="w-4 h-4 text-muted-foreground" />
         <a href={`tel:${contact.phone}`} className="hover:text-foreground">
          {contact.phone}
         </a>
        </div>
       )}
       {contact.linkedinUrl && (
        <div className="flex items-center gap-3 text-muted-foreground">
         <Linkedin className="w-4 h-4 text-muted-foreground" />
         <a
          href={contact.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
         >
          Profil LinkedIn
         </a>
        </div>
       )}
       {contact.company?.address && (
        <div className="flex items-start gap-3 text-muted-foreground">
         <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
         <span>
          {contact.company.address}<br />
          {contact.company.postalCode} {contact.company.city}
         </span>
        </div>
       )}
      </div>

      {/* Tags */}
      <div className="bg-card rounded-xl border border-border mt-4">
       <h3 className="font-semibold text-foreground mb-4">Tags</h3>
       <TagInput
        entityId={contact.id}
        entityType="contact"
        initialTags={contact.allTags}
        assignedTags={contact.tags}
       />
      </div>
     </div>

     {/* Opportunities */}
     <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
       <h3 className="font-semibold text-foreground">Opportunités</h3>
       <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Pencil className="w-4 h-4" />
       </Button>
      </div>

      <div className="space-y-3">
       {opportunities.map(opp => (
        <Link
         key={opp.id}
         href="/dashboard/pipeline"
         className="block p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
        >
         <div className="font-medium text-sm text-foreground mb-1">
          {opp.name}
         </div>
         <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
           <Euro className="w-3 h-3" />
           {formatValue(opp.value)}
          </div>
          {opp.stage && (
           <span
            className="px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: opp.stage.color }}
           >
            {opp.stage.name}
           </span>
          )}
         </div>
        </Link>
       ))}

       {opportunities.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-xs">
         Aucune opportunité
        </div>
       )}
      </div>
     </div>

     {/* Billing Summary */}
     {(invoices.length > 0 || quotes.length > 0) && (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
       <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Facturation
       </h3>

       {/* Revenue summary */}
       <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-center">
         <p className="text-xs text-muted-foreground">Encaissé</p>
         <p className="font-bold text-green-700 dark:text-green-400">
          {formatPrice(invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.total || 0), 0))}
         </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-center">
         <p className="text-xs text-muted-foreground">Facturé</p>
         <p className="font-bold text-blue-700 dark:text-blue-400">
          {formatPrice(invoices.reduce((s: number, i: any) => s + (i.total || 0), 0))}
         </p>
        </div>
       </div>

       {/* Recent invoices */}
       {invoices.length > 0 && (
        <div className="mb-3">
         <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Receipt className="w-3 h-3" />
          Factures ({invoices.length})
         </p>
         <div className="space-y-1.5">
          {invoices.slice(0, 3).map((inv: any) => (
           <Link
            key={inv.id}
            href={`/dashboard/invoices/${inv.id}`}
            className="flex items-center justify-between p-2 rounded border text-sm hover:bg-muted/50 transition-colors"
           >
            <span className="font-mono text-xs">{inv.number}</span>
            <span className="font-medium">{formatPrice(inv.total)}</span>
           </Link>
          ))}
          {invoices.length > 3 && (
           <p className="text-xs text-muted-foreground text-center">+{invoices.length - 3} autres</p>
          )}
         </div>
        </div>
       )}

       {/* Recent quotes */}
       {quotes.length > 0 && (
        <div>
         <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Devis ({quotes.length})
         </p>
         <div className="space-y-1.5">
          {quotes.slice(0, 3).map((q: any) => (
           <Link
            key={q.id}
            href={`/dashboard/quotes/${q.id}`}
            className="flex items-center justify-between p-2 rounded border text-sm hover:bg-muted/50 transition-colors"
           >
            <span className="font-mono text-xs">{q.number}</span>
            <span className="font-medium">{formatPrice(q.total)}</span>
           </Link>
          ))}
          {quotes.length > 3 && (
           <p className="text-xs text-muted-foreground text-center">+{quotes.length - 3} autres</p>
          )}
         </div>
        </div>
       )}
      </div>
     )}
    </div>
   </div>
  </div>
 )
}
