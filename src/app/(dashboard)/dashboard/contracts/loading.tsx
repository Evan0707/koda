import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ContractsLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <Skeleton className="h-8 w-32 mb-2" />
     <Skeleton className="h-4 w-56" />
    </div>
    <Skeleton className="h-10 w-40" />
   </div>

   {/* Tabs */}
   <Skeleton className="h-10 w-64" />

   {/* Filters */}
   <div className="flex items-center gap-4">
    <Skeleton className="h-10 flex-1 max-w-sm" />
    <Skeleton className="h-10 w-[180px]" />
   </div>

   {/* Cards Grid */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
     <Card key={i}>
      <CardHeader className="pb-3">
       <div className="flex items-start justify-between">
        <div className="space-y-2">
         <Skeleton className="h-5 w-40" />
         <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-8" />
       </div>
      </CardHeader>
      <CardContent className="space-y-3">
       <Skeleton className="h-6 w-24 rounded-full" />
       <Skeleton className="h-4 w-32" />
       <Skeleton className="h-3 w-28" />
      </CardContent>
     </Card>
    ))}
   </div>
  </div>
 )
}
