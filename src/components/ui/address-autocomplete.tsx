'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { searchAddress } from '@/lib/actions/address'

interface AddressFeature {
 type: 'Feature'
 geometry: {
  type: 'Point'
 }
 properties: {
  label: string
  score: number
  id: string
  type: string
  name: string
  postcode: string
  citycode: string
  x: number
  y: number
  city: string
  context: string
  importance: number
  street: string
 }
}

interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
 onAddressSelect?: (address: AddressFeature['properties']) => void
 label?: string
}

export function AddressAutocomplete({ onAddressSelect, label, className, id, name, defaultValue, ...props }: AddressAutocompleteProps) {
 const [query, setQuery] = useState((defaultValue as string) || '')
 const [results, setResults] = useState<AddressFeature[]>([])
 const [isOpen, setIsOpen] = useState(false)
 const [isLoading, setIsLoading] = useState(false)
 const [errorMsg, setErrorMsg] = useState<string | null>(null)

 const wrapperRef = useRef<HTMLDivElement>(null)
 // We use a custom useDebounce hook. If not available, we can just inline a timeout, 
 // but let's assume it exists or we will create it if compilation fails.
 // Actually, let's just use a local debounce to be safe and dependency-free here.

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
    setIsOpen(false)
   }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
 }, [])

 useEffect(() => {
  let active = true

  const fetchAddresses = async () => {
   if (!query || query.length < 3) {
    setResults([])
    setErrorMsg(null)
    return
   }

   setIsLoading(true)
   setErrorMsg(null)

   try {
    const result = await searchAddress(query)
    if (!active) return

    if (result.error) {
     throw new Error(result.error)
    }

    setResults(result.features || [])
    setIsOpen(true)
   } catch (e) {
    if (!active) return
    // Do NOT use console.error here to prevent Next.js dev overlay from popping up on network failure.
    // Instead, we show it gracefully in the UI.
    setErrorMsg("Impossible de joindre le service d'adresses (API indisponible ou bloquée).")
    setResults([])
   } finally {
    if (active) setIsLoading(false)
   }
  }

  const timeoutId = setTimeout(() => {
   fetchAddresses()
  }, 300)

  return () => {
   active = false
   clearTimeout(timeoutId)
  }
 }, [query])

 const handleSelect = (feature: AddressFeature) => {
  // We set the input to the street name instead of full label (which includes city)
  const streetName = feature.properties.name || feature.properties.street || feature.properties.label.split(' - ')[0] || feature.properties.label
  setQuery(streetName)
  setIsOpen(false)
  if (onAddressSelect) {
   onAddressSelect(feature.properties)
  }
 }

 // Hidden input to ensure native FormData still picks up the value if used in a traditional form submission
 return (
  <div className="relative w-full" ref={wrapperRef}>
   {label && <Label htmlFor={id}>{label}</Label>}
   <Input
    type="text"
    id={id}
    autoComplete="off"
    value={query}
    onChange={(e) => {
     setQuery(e.target.value)
     setIsOpen(true)
    }}
    onFocus={() => {
     if (query.length >= 3) setIsOpen(true)
    }}
    className={className}
    {...props}
   />
   <input type="hidden" name={name} value={query} />

   {isOpen && query.length >= 3 && (
    <ul className="absolute z-[100] w-full bg-popover text-popover-foreground mt-1 border rounded-md shadow-md max-h-60 overflow-auto">
     {isLoading ? (
      <li className="px-4 py-3 text-sm text-muted-foreground text-center animate-pulse">
       Recherche en cours...
      </li>
     ) : errorMsg ? (
      <li className="px-4 py-3 text-sm text-destructive text-center">
       {errorMsg}
      </li>
     ) : results.length > 0 ? (
      results.map((feature) => (
       <li
        key={feature.properties.id}
        className="px-4 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-0"
        onClick={() => handleSelect(feature)}
       >
        <div className="font-medium">{feature.properties.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
         {feature.properties.context}
        </div>
       </li>
      ))
     ) : (
      <li className="px-4 py-3 text-sm text-muted-foreground text-center">
       Aucune adresse trouvée
      </li>
     )}
    </ul>
   )}
  </div>
 )
}
