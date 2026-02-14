import { Skeleton } from '@/components/ui/skeleton'

export default function ContactsLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <Skeleton className="h-8 w-24 mb-2" />
     <Skeleton className="h-4 w-56" />
    </div>
   </div>

   {/* Tabs */}
   <Skeleton className="h-10 w-56" />

   {/* Filters */}
   <div className="flex items-center gap-4 flex-wrap">
    <Skeleton className="h-10 flex-1 min-w-[200px]" />
    <Skeleton className="h-10 w-[180px]" />
   </div>

   {/* Action buttons */}
   <div className="flex items-center gap-2">
    <Skeleton className="h-10 w-28" />
    <Skeleton className="h-10 w-36" />
   </div>

   {/* Table */}
   <div className="bg-card rounded-lg border overflow-hidden">
    <table className="w-full">
     <thead className="bg-muted/50 border-b">
      <tr>
       <th className="px-4 py-3 text-left"><Skeleton className="h-3 w-16" /></th>
       <th className="px-4 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
       <th className="px-4 py-3 text-left"><Skeleton className="h-3 w-12" /></th>
       <th className="px-4 py-3 text-left"><Skeleton className="h-3 w-20" /></th>
       <th className="px-4 py-3 w-10" />
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
        <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
        <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
        <td className="px-4 py-3"><Skeleton className="h-8 w-8 rounded" /></td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </div>
 )
}
