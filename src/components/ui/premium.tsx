'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PageTransitionProps {
 children: React.ReactNode
 className?: string
 animation?: 'fade' | 'slide-up' | 'scale'
}

export function PageTransition({
 children,
 className,
 animation = 'fade'
}: PageTransitionProps) {
 const animationClass = {
  'fade': 'animate-fade-in',
  'slide-up': 'animate-fade-in-up',
  'scale': 'animate-scale-in',
 }

 return (
  <div className={cn(animationClass[animation], className)}>
   {children}
  </div>
 )
}

// Staggered list container
interface StaggeredListProps {
 children: React.ReactNode
 className?: string
}

export function StaggeredList({ children, className }: StaggeredListProps) {
 return (
  <div className={cn("animate-stagger", className)}>
   {children}
  </div>
 )
}

// Card with premium hover effect
interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
 children: React.ReactNode
 hoverable?: boolean
 glowing?: boolean
}

export function PremiumCard({
 children,
 className,
 hoverable = true,
 glowing = false,
 ...props
}: PremiumCardProps) {
 return (
  <div
   className={cn(
    "rounded-lg border bg-card p-6 transition-all duration-300",
    hoverable && "card-premium cursor-pointer",
    glowing && "animate-glow-pulse",
    className
   )}
   {...props}
  >
   {children}
  </div>
 )
}

// Glass effect container
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
 children: React.ReactNode
}

export function GlassContainer({ children, className, ...props }: GlassContainerProps) {
 return (
  <div
   className={cn(
    "glass-effect rounded-xl p-6",
    className
   )}
   {...props}
  >
   {children}
  </div>
 )
}

// Gradient button
interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 children: React.ReactNode
 size?: 'sm' | 'md' | 'lg'
}

export function GradientButton({
 children,
 className,
 size = 'md',
 ...props
}: GradientButtonProps) {
 const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
 }

 return (
  <button
   className={cn(
    "btn-gradient text-white font-medium rounded-lg inline-flex items-center justify-center gap-2",
    "focus:outline-none focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    sizeClasses[size],
    className
   )}
   {...props}
  >
   {children}
  </button>
 )
}

// Floating Action Button
interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 children: React.ReactNode
 position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
}

export function FAB({
 children,
 className,
 position = 'bottom-right',
 ...props
}: FABProps) {
 const positionClasses = {
  'bottom-right': 'right-6 bottom-6',
  'bottom-left': 'left-6 bottom-6',
  'bottom-center': 'left-1/2 -translate-x-1/2 bottom-6',
 }

 return (
  <button
   className={cn(
    "fixed z-50 w-14 h-14 rounded-full btn-gradient text-white shadow-lg",
    "flex items-center justify-center",
    "hover:shadow-xl transition-all duration-300",
    "animate-float",
    positionClasses[position],
    className
   )}
   {...props}
  >
   {children}
  </button>
 )
}

// Stat card with animation
interface StatCardProps {
 icon: React.ReactNode
 label: string
 value: React.ReactNode
 trend?: { value: number; positive: boolean }
 iconBg?: string
 className?: string
}

export function StatCard({
 icon,
 label,
 value,
 trend,
 iconBg = "bg-primary/10",
 className
}: StatCardProps) {
 return (
  <div className={cn(
   "p-6 rounded-lg border bg-card transition-all duration-300 card-premium",
   className
  )}>
   <div className="flex items-center gap-4">
    <div className={cn("p-3 rounded-lg", iconBg)}>
     {icon}
    </div>
    <div className="flex-1 min-w-0">
     <p className="text-sm text-muted-foreground">{label}</p>
     <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-foreground animate-count-up">
       {value}
      </span>
      {trend && (
       <span className={cn(
        "text-xs font-medium",
        trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
       )}>
        {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
       </span>
      )}
     </div>
    </div>
   </div>
  </div>
 )
}

// Empty state with animation
interface EmptyStateAnimatedProps {
 icon: React.ReactNode
 title: string
 description: string
 action?: React.ReactNode
 className?: string
}

export function EmptyStateAnimated({
 icon,
 title,
 description,
 action,
 className
}: EmptyStateAnimatedProps) {
 return (
  <div className={cn(
   "flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up",
   className
  )}>
   <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 animate-bounce-in">
    {icon}
   </div>
   <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
   <p className="text-muted-foreground max-w-md mb-6">{description}</p>
   {action}
  </div>
 )
}
