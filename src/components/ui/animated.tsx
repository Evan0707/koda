'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
 value: number
 duration?: number
 className?: string
 prefix?: string
 suffix?: string
 decimals?: number
}

export function AnimatedCounter({
 value,
 duration = 1000,
 className,
 prefix = '',
 suffix = '',
 decimals = 0,
}: AnimatedCounterProps) {
 const [displayValue, setDisplayValue] = useState(0)
 const prevValue = useRef(0)

 useEffect(() => {
  const startValue = prevValue.current
  const endValue = value
  const startTime = Date.now()

  const animate = () => {
   const now = Date.now()
   const elapsed = now - startTime
   const progress = Math.min(elapsed / duration, 1)

   // Easing function (ease-out cubic)
   const easeOut = 1 - Math.pow(1 - progress, 3)

   const currentValue = startValue + (endValue - startValue) * easeOut
   setDisplayValue(currentValue)

   if (progress < 1) {
    requestAnimationFrame(animate)
   } else {
    prevValue.current = endValue
   }
  }

  requestAnimationFrame(animate)
 }, [value, duration])

 const formattedValue = decimals > 0
  ? displayValue.toFixed(decimals)
  : Math.round(displayValue).toLocaleString('fr-FR')

 return (
  <span className={cn("tabular-nums animate-count-up", className)}>
   {prefix}{formattedValue}{suffix}
  </span>
 )
}

// Loading dots component
export function LoadingDots({ className }: { className?: string }) {
 return (
  <div className={cn("loading-dots flex items-center justify-center", className)}>
   <span />
   <span />
   <span />
  </div>
 )
}

// Animated progress bar
interface ProgressBarProps {
 value: number
 max?: number
 className?: string
 showLabel?: boolean
 animated?: boolean
 color?: 'primary' | 'success' | 'warning' | 'destructive'
}

export function ProgressBar({
 value,
 max = 100,
 className,
 showLabel = false,
 animated = true,
 color = 'primary',
}: ProgressBarProps) {
 const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

 const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
 }

 return (
  <div className={cn("w-full", className)}>
   <div className="h-2 bg-muted rounded-full overflow-hidden">
    <div
     className={cn(
      "h-full rounded-full transition-all duration-500 ease-out",
      colorClasses[color],
      animated && "progress-animated"
     )}
     style={{ width: `${percentage}%` }}
    />
   </div>
   {showLabel && (
    <p className="text-xs text-muted-foreground mt-1 text-right">
     {Math.round(percentage)}%
    </p>
   )}
  </div>
 )
}

// Pulse indicator for live/active states
export function PulseIndicator({
 className,
 color = 'success'
}: {
 className?: string
 color?: 'success' | 'warning' | 'destructive' | 'primary'
}) {
 const colorClasses = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  primary: 'bg-primary',
 }

 return (
  <span className={cn("relative flex h-3 w-3", className)}>
   <span className={cn(
    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
    colorClasses[color]
   )} />
   <span className={cn(
    "relative inline-flex rounded-full h-3 w-3",
    colorClasses[color]
   )} />
  </span>
 )
}

// Sparkline mini chart
interface SparklineProps {
 data: number[]
 className?: string
 color?: string
 height?: number
}

export function Sparkline({
 data,
 className,
 color = 'hsl(var(--primary))',
 height = 32
}: SparklineProps) {
 if (data.length < 2) return null

 const min = Math.min(...data)
 const max = Math.max(...data)
 const range = max - min || 1

 const points = data.map((value, index) => {
  const x = (index / (data.length - 1)) * 100
  const y = 100 - ((value - min) / range) * 100
  return `${x},${y}`
 }).join(' ')

 return (
  <svg
   viewBox="0 0 100 100"
   preserveAspectRatio="none"
   className={cn("w-full", className)}
   style={{ height }}
  >
   <polyline
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    points={points}
   />
  </svg>
 )
}

// Animated success checkmark
export function SuccessCheck({ className }: { className?: string }) {
 return (
  <div className={cn(
   "w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-bounce-in",
   className
  )}>
   <svg
    className="w-8 h-8 text-green-600 dark:text-green-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
   >
    <path
     strokeLinecap="round"
     strokeLinejoin="round"
     strokeWidth={3}
     d="M5 13l4 4L19 7"
     className="animate-[draw_0.3s_ease-out_0.2s_forwards]"
     style={{
      strokeDasharray: 24,
      strokeDashoffset: 24,
      animation: 'draw 0.3s ease-out 0.2s forwards'
     }}
    />
   </svg>
  </div>
 )
}
