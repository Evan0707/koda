'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
 message?: string
 onRetry?: () => void
}

/**
 * Standardized error state component for in-page errors.
 * Use this instead of raw <div>Erreur: ...</div>.
 */
export function ErrorState({
 message = 'Une erreur est survenue lors du chargement.',
 onRetry,
}: ErrorStateProps) {
 return (
  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
   <div className="p-4 bg-destructive/10 rounded-full mb-4">
    <AlertCircle className="w-12 h-12 text-destructive/60" />
   </div>
   <h3 className="text-lg font-medium text-foreground mb-1">Erreur</h3>
   <p className="mb-4 max-w-sm">{message}</p>
   {onRetry && (
    <Button variant="outline" onClick={onRetry}>
     <RefreshCw className="w-4 h-4 mr-2" />
     Réessayer
    </Button>
   )}
  </div>
 )
}
