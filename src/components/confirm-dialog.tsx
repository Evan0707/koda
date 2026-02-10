'use client'

import { useState, createContext, useContext, useCallback } from 'react'
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

type ConfirmOptions = {
 title: string
 description?: string
 confirmText?: string
 cancelText?: string
 variant?: 'default' | 'destructive'
 onConfirm: () => Promise<void> | void
}

type ConfirmContextType = {
 confirm: (options: ConfirmOptions) => void
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
 const context = useContext(ConfirmContext)
 if (!context) {
  throw new Error('useConfirm must be used within a ConfirmProvider')
 }
 return context
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
 const [isOpen, setIsOpen] = useState(false)
 const [isLoading, setIsLoading] = useState(false)
 const [options, setOptions] = useState<ConfirmOptions | null>(null)

 const confirm = useCallback((opts: ConfirmOptions) => {
  setOptions(opts)
  setIsOpen(true)
 }, [])

 const handleConfirm = async () => {
  if (!options) return
  setIsLoading(true)
  try {
   await options.onConfirm()
  } finally {
   setIsLoading(false)
   setIsOpen(false)
   setOptions(null)
  }
 }

 const handleCancel = () => {
  if (isLoading) return
  setIsOpen(false)
  setOptions(null)
 }

 return (
  <ConfirmContext.Provider value={{ confirm }}>
   {children}
   <AlertDialog open={isOpen} onOpenChange={(open: boolean) => !isLoading && !open && handleCancel()}>
    <AlertDialogContent>
     <AlertDialogHeader>
      <AlertDialogTitle>{options?.title || 'Confirmer'}</AlertDialogTitle>
      {options?.description && (
       <AlertDialogDescription>{options.description}</AlertDialogDescription>
      )}
     </AlertDialogHeader>
     <AlertDialogFooter>
      <AlertDialogCancel disabled={isLoading} onClick={handleCancel}>
       {options?.cancelText || 'Annuler'}
      </AlertDialogCancel>
      <AlertDialogAction
       onClick={handleConfirm}
       disabled={isLoading}
       className={options?.variant === 'destructive'
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
        : 'bg-indigo-600 hover:bg-indigo-700'
       }
      >
       {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
       ) : null}
       {options?.confirmText || 'Confirmer'}
      </AlertDialogAction>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  </ConfirmContext.Provider>
 )
}
