'use client'

import * as React from 'react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'


interface SiretInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
 value?: string
 defaultValue?: string
 onChange?: (value: string) => void
}

export function SiretInput({ className, value: externalValue, defaultValue, onChange, ...props }: SiretInputProps) {
 // Format SIRET: 123 456 789 00012
 const formatSiret = (val: string) => {
  // Remove all non-digits
  const digits = val.replace(/\D/g, '')
  // Cap at 14 digits
  const capped = digits.slice(0, 14)

  // Group: 3, 3, 3, 5
  const parts = []
  if (capped.length > 0) parts.push(capped.slice(0, 3))
  if (capped.length > 3) parts.push(capped.slice(3, 6))
  if (capped.length > 6) parts.push(capped.slice(6, 9))
  if (capped.length > 9) parts.push(capped.slice(9, 14))

  return parts.join(' ')
 }

 const [localValue, setLocalValue] = useState(formatSiret((externalValue || defaultValue || '') as string))

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value

  // If user is deleting spaces, it might cause cursor jump issues, 
  // but a simple controlled formatting works well enough for this use case.
  const formatted = formatSiret(rawValue)

  setLocalValue(formatted)

  if (onChange) {
   // Send raw digits back or formatted depending on preference. 
   // Often, backend expects raw digits or stores with spaces. 
   // We'll send formatted to keep form data consistent with input.
   onChange(formatted)
  }
 }

 // Sync external value if it changes
 React.useEffect(() => {
  if (externalValue !== undefined) {
   setLocalValue(formatSiret(externalValue))
  }
 }, [externalValue])

 return (
  <Input
   type="text"
   value={localValue}
   onChange={handleChange}
   className={className}
   {...props}
  />
 )
}
