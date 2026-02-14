import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SettingsLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div>
    <Skeleton className="h-8 w-40 mb-2" />
    <Skeleton className="h-4 w-64" />
   </div>

   {/* Tabs */}
   <Skeleton className="h-10 w-96" />

   {/* Settings Cards */}
   <div className="space-y-6">
    <Card>
     <CardHeader>
      <Skeleton className="h-6 w-48 mb-1" />
      <Skeleton className="h-4 w-72" />
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
       <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
       </div>
       <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
       </div>
      </div>
      <div className="space-y-2">
       <Skeleton className="h-4 w-20" />
       <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32 ml-auto" />
     </CardContent>
    </Card>

    <Card>
     <CardHeader>
      <Skeleton className="h-6 w-48 mb-1" />
      <Skeleton className="h-4 w-72" />
     </CardHeader>
     <CardContent className="space-y-4">
      <div className="space-y-2">
       <Skeleton className="h-4 w-20" />
       <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
       <Skeleton className="h-4 w-20" />
       <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-10 w-32 ml-auto" />
     </CardContent>
    </Card>
   </div>
  </div>
 )
}
