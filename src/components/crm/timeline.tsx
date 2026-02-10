'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import {
 Phone,
 Mail,
 Calendar,
 FileText,
 CheckSquare,
 MessageSquare,
 User,
 Loader2
} from 'lucide-react'
import { createActivity } from '@/lib/actions/activities'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type Activity = {
 id: string
 type: string
 content: string
 performedAt: Date
 creator: {
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
 } | null
}

export function Timeline({
 entityId,
 entityType,
 activities
}: {
 entityId: string
 entityType: 'contact' | 'company' | 'opportunity'
 activities: Activity[]
}) {
 const [isPending, startTransition] = useTransition()
 const [type, setType] = useState('note')
 const [content, setContent] = useState('')

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!content.trim()) return

  const formData = new FormData()
  formData.append('type', type)
  formData.append('content', content)
  if (entityType === 'contact') formData.append('contactId', entityId)
  if (entityType === 'company') formData.append('companyId', entityId)
  if (entityType === 'opportunity') formData.append('opportunityId', entityId)

  startTransition(async () => {
   const result = await createActivity(formData)
   if (result.error) {
    toast.error(result.error)
   } else {
    toast.success('Activité ajoutée')
    setContent('')
   }
  })
 }

 const getIcon = (type: string) => {
  switch (type) {
   case 'call': return <Phone className="w-4 h-4 text-blue-500" />
   case 'email': return <Mail className="w-4 h-4 text-gray-500" />
   case 'meeting': return <Calendar className="w-4 h-4 text-green-500" />
   case 'task': return <CheckSquare className="w-4 h-4 text-orange-500" />
   default: return <FileText className="w-4 h-4 text-gray-400" />
  }
 }

 const getLabel = (type: string) => {
  switch (type) {
   case 'call': return 'Appel'
   case 'email': return 'Email'
   case 'meeting': return 'Réunion'
   case 'task': return 'Tâche'
   default: return 'Note'
  }
 }

 return (
  <div className="space-y-6">
   <div className="bg-gray-50 rounded-lg p-4 border text-sm">
    <form onSubmit={handleSubmit} className="space-y-3">
     <div className="flex gap-2">
      <Select value={type} onValueChange={setType}>
       <SelectTrigger className="w-[140px] h-9">
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="note">
         <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" /> Note
         </div>
        </SelectItem>
        <SelectItem value="call">
         <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" /> Appel
         </div>
        </SelectItem>
        <SelectItem value="email">
         <div className="flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email
         </div>
        </SelectItem>
        <SelectItem value="meeting">
         <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Réunion
         </div>
        </SelectItem>
       </SelectContent>
      </Select>
     </div>
     <Textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
      placeholder="Écrivez une note, un résumé d'appel..."
      className="resize-none bg-white min-h-[80px]"
     />
     <div className="flex justify-end">
      <Button size="sm" type="submit" disabled={isPending || !content.trim()}>
       {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
       Enregistrer
      </Button>
     </div>
    </form>
   </div>

   <div className="space-y-4">
    {activities.map((activity) => (
     <div key={activity.id} className="flex gap-3 relative pb-6 last:pb-0">
      {/* Connector line */}
      <div className="absolute top-8 left-4 bottom-0 w-px bg-gray-200 -ml-px last:hidden" />

      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center shadow-sm z-10">
       {getIcon(activity.type)}
      </div>

      <div className="flex-1 min-w-0">
       <div className="flex items-center gap-2 mb-0.5">
        <span className="font-medium text-sm text-gray-900">
         {getLabel(activity.type)}
        </span>
        <span className="text-xs text-gray-500">
         • {formatDistanceToNow(new Date(activity.performedAt), { addSuffix: true, locale: fr })}
        </span>
       </div>
       <div className="text-sm text-gray-600 bg-white p-3 rounded-lg border shadow-sm whitespace-pre-wrap">
        {activity.content}
       </div>
       {activity.creator && (
        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
         <User className="w-3 h-3" />
         {activity.creator.first_name} {activity.creator.last_name}
        </div>
       )}
      </div>
     </div>
    ))}

    {activities.length === 0 && (
     <div className="text-center py-8 text-gray-500 text-sm">
      Aucune activité pour le moment
     </div>
    )}
   </div>
  </div>
 )
}
