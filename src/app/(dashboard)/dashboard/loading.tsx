import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
 return (
  <div className="p-6 space-y-6">
   {/* Header Skeleton */}
   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
    <div>
     <Skeleton className="h-8 w-48 mb-2" />
     <Skeleton className="h-4 w-64" />
    </div>
    <div className="flex items-center gap-4">
     <Skeleton className="h-9 w-64" /> {/* DatePicker */}
     <Skeleton className="h-9 w-36" /> {/* Action Button */}
    </div>
   </div>

   {/* KPI Grid Skeleton */}
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
     <Card key={i}>
      <CardContent className="pt-6 flex items-start justify-between">
       <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
       </div>
       <Skeleton className="h-10 w-10 rounded-lg" />
      </CardContent>
     </Card>
    ))}
   </div>

   {/* Main Content Grid */}
   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Chart Area - Spans 2 cols */}
    <Card className="lg:col-span-2">
     <CardHeader>
      <Skeleton className="h-6 w-48" />
     </CardHeader>
     <CardContent>
      <Skeleton className="h-[300px] w-full rounded-xl" />
     </CardContent>
    </Card>

    {/* Sidebar/Activity Area - Spans 1 col */}
    <Card className="lg:col-span-1">
     <CardHeader>
      <Skeleton className="h-6 w-32" />
     </CardHeader>
     <CardContent className="space-y-6">
      {[...Array(5)].map((_, i) => (
       <div key={i} className="flex items-start gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2 flex-1">
         <Skeleton className="h-4 w-full" />
         <Skeleton className="h-3 w-24" />
        </div>
       </div>
      ))}
     </CardContent>
    </Card>
   </div>
  </div>
 )
}
