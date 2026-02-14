import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ProjectsLoading() {
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

   {/* Filters */}
   <div className="flex items-center gap-4">
    <Skeleton className="h-10 flex-1" />
    <Skeleton className="h-10 w-40" />
   </div>

   {/* Cards Grid */}
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
     <Card key={i}>
      <CardContent className="p-5 space-y-4">
       <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-8 w-8" />
       </div>
       <Skeleton className="h-4 w-full" />
       <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
       </div>
       <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
       </div>
      </CardContent>
     </Card>
    ))}
   </div>
  </div>
 )
}
