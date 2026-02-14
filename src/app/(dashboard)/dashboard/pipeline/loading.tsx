import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function PipelineLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <Skeleton className="h-8 w-32 mb-2" />
     <Skeleton className="h-4 w-56" />
    </div>
    <Skeleton className="h-10 w-48" />
   </div>

   {/* Pipeline Columns */}
   <div className="flex gap-4 overflow-x-auto pb-4">
    {[...Array(5)].map((_, col) => (
     <div key={col} className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-3">
      {/* Column header */}
      <div className="flex items-center justify-between mb-2">
       <Skeleton className="h-5 w-24" />
       <Skeleton className="h-5 w-16" />
      </div>
      {/* Cards */}
      {[...Array(col === 0 ? 3 : col === 1 ? 2 : 1)].map((_, card) => (
       <Card key={card} className="shadow-sm">
        <CardContent className="p-3 space-y-2">
         <Skeleton className="h-4 w-full" />
         <Skeleton className="h-3 w-24" />
         <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6 rounded-full" />
         </div>
        </CardContent>
       </Card>
      ))}
     </div>
    ))}
   </div>
  </div>
 )
}
