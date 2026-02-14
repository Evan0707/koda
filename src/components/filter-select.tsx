'use client'

import { Filter } from 'lucide-react'
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FilterSelectOption {
 value: string
 label: string
}

interface FilterSelectProps {
 value: string
 onChange: (value: string) => void
 options: FilterSelectOption[]
 placeholder?: string
 className?: string
}

export function FilterSelect({
 value,
 onChange,
 options,
 placeholder = 'Filtrer par statut',
 className,
}: FilterSelectProps) {
 return (
  <Select value={value} onValueChange={onChange}>
   <SelectTrigger className={cn("w-[180px]", className)}>
    <Filter className="w-4 h-4 mr-2" />
    <SelectValue placeholder={placeholder} />
   </SelectTrigger>
   <SelectContent>
    {options.map(option => (
     <SelectItem key={option.value} value={option.value}>
      {option.label}
     </SelectItem>
    ))}
   </SelectContent>
  </Select>
 )
}
