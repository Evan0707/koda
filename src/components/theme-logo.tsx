'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeLogoProps {
 className?: string
 alt?: string
}

export function ThemeLogo({ className = 'w-8 h-8', alt = 'KodaFlow' }: ThemeLogoProps) {
 const { resolvedTheme } = useTheme()
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
  setMounted(true)
 }, [])

 // Before mount, show both with CSS to avoid hydration mismatch
 if (!mounted) {
  return (
   <>
    <img src="/LogoLightMod.svg" alt={alt} className={`${className} dark:hidden`} />
    <img src="/LogoDarkMod.svg" alt={alt} className={`${className} hidden dark:block`} />
   </>
  )
 }

 const src = resolvedTheme === 'dark' ? '/LogoDarkMod.svg' : '/LogoLightMod.svg'

 return <img src={src} alt={alt} className={className} />
}
