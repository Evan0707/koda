import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the app base URL.
 * In production, NEXT_PUBLIC_APP_URL must be set.
 * Falls back to localhost:3000 in dev only.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (url) return url

  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️ NEXT_PUBLIC_APP_URL is missing in production — generated links will be broken!')
  }

  return 'http://localhost:3000'
}
