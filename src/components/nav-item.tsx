'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

export function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname()

  // Check if this nav item is active
  const isActive = href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 transition-colors",
        isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
      )} />
      <span className="text-sm">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
      )}
    </Link>
  )
}
