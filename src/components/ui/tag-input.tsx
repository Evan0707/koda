'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
 Command,
 CommandEmpty,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
 CommandSeparator,
} from '@/components/ui/command'
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { createTag, assignTag, removeTag } from '@/lib/actions/tags'
import { toast } from 'sonner'

type Tag = {
 id: string
 name: string
 color: string | null
}

type TagInputProps = {
 entityId: string
 entityType: 'contact' | 'company' | 'opportunity'
 initialTags?: Tag[] // All available tags
 assignedTags?: Tag[] // Tags currently assigned to this entity
 onTagChange?: () => void
}

export function TagInput({
 entityId,
 entityType,
 initialTags = [],
 assignedTags = [],
 onTagChange
}: TagInputProps) {
 const [open, setOpen] = React.useState(false)
 const [inputValue, setInputValue] = React.useState('')
 const [availableTags, setAvailableTags] = React.useState<Tag[]>(initialTags)
 const [selectedTags, setSelectedTags] = React.useState<Tag[]>(assignedTags)
 const [isPending, setIsPending] = React.useState(false)
 const [selectedColor, setSelectedColor] = React.useState('#6366f1')

 const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#d946ef', // fuchsia
  '#64748b', // slate
 ]

 const handleCreateTag = async () => {
  if (!inputValue.trim()) return

  setIsPending(true)
  const result = await createTag(inputValue.trim(), selectedColor)

  if ('error' in result) {
   toast.error(result.error)
  } else {
   setAvailableTags(prev => [...prev, result.tag])
   handleSelectTag(result.tag)
   setInputValue('')
   toast.success('Tag créé')
  }
  setIsPending(false)
 }

 const handleSelectTag = async (tag: Tag) => {
  // Check if already selected
  const isSelected = selectedTags.some(t => t.id === tag.id)

  if (isSelected) {
   // Remove tag
   setSelectedTags(prev => prev.filter(t => t.id !== tag.id))
   const result = await removeTag(tag.id, entityId, entityType)
   if (result.error) toast.error(result.error)
  } else {
   // Add tag
   setSelectedTags(prev => [...prev, tag])
   const result = await assignTag(tag.id, entityId, entityType)
   if (result.error) toast.error(result.error)
  }

  if (onTagChange) onTagChange()
 }

 const filteredTags = availableTags.filter(tag =>
  tag.name.toLowerCase().includes(inputValue.toLowerCase())
 )

 const exactMatch = availableTags.some(
  tag => tag.name.toLowerCase() === inputValue.toLowerCase()
 )

 return (
  <div className="flex flex-col gap-2">
   <div className="flex flex-wrap gap-2 mb-2">
    {selectedTags.map(tag => (
     <Badge
      key={tag.id}
      variant="secondary"
      className="pl-2 pr-1 py-1 flex items-center gap-1"
      style={{
       backgroundColor: tag.color ? `${tag.color}20` : undefined,
       color: tag.color || undefined,
       borderColor: tag.color ? `${tag.color}40` : undefined
      }}
     >
      {tag.name}
      <button
       className="ml-1 hover:bg-black/10 rounded-full p-0.5"
       onClick={() => handleSelectTag(tag)}
      >
       <X className="w-3 h-3" />
      </button>
     </Badge>
    ))}
   </div>

   <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
     <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between text-left font-normal"
     >
      <span className="text-muted-foreground">Ajouter un tag...</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
     </Button>
    </PopoverTrigger>
    <PopoverContent className="w-[300px] p-0" align="start">
     <Command>
      <CommandInput
       placeholder="Rechercher ou créer un tag..."
       value={inputValue}
       onValueChange={setInputValue}
      />
      <CommandList>
       <CommandEmpty className="py-2 px-2 text-sm text-muted-foreground">
        {!isPending && inputValue && !exactMatch ? (
         <div className="space-y-3 p-1">
          <button
           className="w-full text-left p-2 hover:bg-muted rounded-md flex items-center gap-2 text-primary"
           onClick={handleCreateTag}
          >
           <Plus className="w-4 h-4" />
           Créer "{inputValue}"
          </button>
          <div className="flex flex-wrap gap-2 px-2 pb-2">
           {COLORS.map(color => (
            <button
             key={color}
             type="button"
             title={color}
             className={cn(
              "w-5 h-5 rounded-full border-2 transition-transform",
              selectedColor === color ? "border-foreground scale-110" : "border-transparent hover:scale-110"
             )}
             style={{ backgroundColor: color }}
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(color); }}
            />
           ))}
          </div>
         </div>
        ) : (
         <span>Aucun tag trouvé.</span>
        )}
       </CommandEmpty>
       <CommandGroup>
        {filteredTags.map((tag) => {
         const isSelected = selectedTags.some(t => t.id === tag.id)
         return (
          <CommandItem
           key={tag.id}
           value={tag.name}
           onSelect={() => handleSelectTag(tag)}
          >
           <Check
            className={cn(
             "mr-2 h-4 w-4",
             isSelected ? "opacity-100" : "opacity-0"
            )}
           />
           <div className="flex items-center gap-2">
            <div
             className="w-2 h-2 rounded-full"
             style={{ backgroundColor: tag.color || '#6366F1' }}
            />
            {tag.name}
           </div>
          </CommandItem>
         )
        })}
       </CommandGroup>
      </CommandList>
     </Command>
    </PopoverContent>
   </Popover>
  </div>
 )
}
