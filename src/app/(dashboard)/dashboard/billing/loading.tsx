import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function BillingLoading() {
 return (
  <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
   <Skeleton className="h-9 w-64 mb-6" />

   <Card>
    <CardHeader>
     <Skeleton className="h-6 w-40 mb-1" />
     <Skeleton className="h-4 w-56" />
    </CardHeader>
    <CardContent className="space-y-4">
     <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="h-10 w-36" />
     </div>
     <div className="space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-2 w-full rounded-full" />
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
