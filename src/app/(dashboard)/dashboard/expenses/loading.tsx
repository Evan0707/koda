import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
 return (
  <div className="space-y-6 animate-fade-in">
   <div className="flex items-start justify-between">
    <div className="space-y-2">
     <Skeleton className="h-8 w-40" />
     <Skeleton className="h-4 w-64" />
    </div>
    <Skeleton className="h-10 w-44" />
   </div>
   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Skeleton className="h-24 rounded-lg" />
    <Skeleton className="h-24 rounded-lg" />
    <Skeleton className="h-24 rounded-lg" />
   </div>
   <Skeleton className="h-10 w-72" />
   <div className="bg-card rounded-lg border p-4 space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
     <Skeleton key={i} className="h-12 w-full" />
    ))}
   </div>
  </div>
 )
}
