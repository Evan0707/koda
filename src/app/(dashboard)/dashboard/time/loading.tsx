import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function TimeLoading() {
 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div>
     <Skeleton className="h-8 w-48 mb-2" />
     <Skeleton className="h-4 w-56" />
    </div>
    <Skeleton className="h-10 w-40" />
   </div>

   {/* Timer + Summary cards */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="md:col-span-1">
     <CardContent className="pt-6 space-y-4">
      <Skeleton className="h-12 w-32 mx-auto" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
     </CardContent>
    </Card>
    <Card>
     <CardContent className="pt-6 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
     </CardContent>
    </Card>
    <Card>
     <CardContent className="pt-6 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-20" />
     </CardContent>
    </Card>
   </div>

   {/* Entries table */}
   <Card>
    <CardHeader>
     <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
     <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
       <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-24 ml-auto" />
        <Skeleton className="h-8 w-8" />
       </div>
      ))}
     </div>
    </CardContent>
   </Card>
  </div>
 )
}
