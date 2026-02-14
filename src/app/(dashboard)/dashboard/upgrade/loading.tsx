import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function UpgradeLoading() {
 return (
  <div className="space-y-8 max-w-5xl mx-auto">
   {/* Header */}
   <div className="text-center space-y-2">
    <Skeleton className="h-9 w-64 mx-auto" />
    <Skeleton className="h-5 w-96 mx-auto" />
   </div>

   {/* Pricing cards */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[...Array(3)].map((_, i) => (
     <Card key={i} className={i === 1 ? 'border-primary' : ''}>
      <CardHeader>
       <Skeleton className="h-6 w-24 mb-2" />
       <Skeleton className="h-10 w-32" />
       <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
       {[...Array(5)].map((_, j) => (
        <div key={j} className="flex items-center gap-2">
         <Skeleton className="h-4 w-4 rounded-full" />
         <Skeleton className="h-4 flex-1" />
        </div>
       ))}
       <Skeleton className="h-10 w-full mt-4" />
      </CardContent>
     </Card>
    ))}
   </div>
  </div>
 )
}
