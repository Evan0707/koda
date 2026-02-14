import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ProductsLoading() {
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

   {/* Search */}
   <Skeleton className="h-10 max-w-sm" />

   {/* Grid */}
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
     <Card key={i}>
      <CardContent className="p-5 space-y-3">
       <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-8" />
       </div>
       <Skeleton className="h-4 w-full" />
       <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
       </div>
       <Skeleton className="h-6 w-24" />
      </CardContent>
     </Card>
    ))}
   </div>
  </div>
 )
}
