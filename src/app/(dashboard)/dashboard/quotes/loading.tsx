import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function QuotesLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <Skeleton className="h-8 w-32 mb-2" />
     <Skeleton className="h-4 w-56" />
    </div>
    <Skeleton className="h-10 w-36" />
   </div>

   {/* Filters */}
   <div className="flex items-center gap-4">
    <Skeleton className="h-10 flex-1 max-w-sm" />
    <Skeleton className="h-10 w-[180px]" />
   </div>

   {/* Table */}
   <div className="bg-card rounded-lg border overflow-hidden">
    <div className="bg-muted/50 border-b px-4 py-3 flex gap-4">
     {['w-32', 'w-24', 'w-20', 'w-24', 'w-24', 'w-8'].map((w, i) => (
      <Skeleton key={i} className={`h-4 ${w}`} />
     ))}
    </div>
    {[...Array(6)].map((_, i) => (
     <div key={i} className="flex items-center gap-4 px-4 py-4 border-b last:border-0">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded" />
     </div>
    ))}
   </div>
  </div>
 )
}
