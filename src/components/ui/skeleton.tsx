'use client'

import { cn } from '@/lib/utils'

// Base skeleton with shimmer effect
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted animate-pulse rounded-md relative overflow-hidden",
        "after:absolute after:inset-0 after:translate-x-[-100%]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        "after:animate-[shimmer_2s_infinite]",
        className
      )}
      {...props}
    />
  )
}

// Skeleton for text lines
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

// Skeleton for table rows
function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-32" : i === columns - 1 ? "w-8" : "w-24"
          )}
        />
      ))}
    </div>
  )
}

// Skeleton for cards
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}

// Skeleton for stat cards
function SkeletonStatCard() {
  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  )
}

// Full table skeleton
function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 border-b border-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  )
}

// Dashboard skeleton
function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="h-[300px]" />
        <SkeletonCard className="h-[300px]" />
      </div>
    </div>
  )
}

// Page skeleton with header
function SkeletonPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      {/* Table */}
      <SkeletonTable rows={8} columns={5} />
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonTableRow,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonTable,
  SkeletonDashboard,
  SkeletonPage
}
