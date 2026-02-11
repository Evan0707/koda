'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 useEffect(() => {
  // Log the error to an error reporting service
  console.error(error)
 }, [error])

 return (
  <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center p-6">
   <div className="rounded-full bg-destructive/10 p-4">
    <AlertCircle className="h-12 w-12 text-destructive" />
   </div>
   <div className="space-y-2">
    <h2 className="text-3xl font-bold tracking-tighter">Une erreur est survenue</h2>
    <p className="max-w-[600px] text-muted-foreground">
     Nous nous excusons pour ce désagrément. Une erreur inattendue s&apos;est produite.
    </p>
    {process.env.NODE_ENV === 'development' && (
     <div className="bg-muted p-4 rounded text-left overflow-auto max-w-2xl mx-auto mt-4 text-xs font-mono">
      <p className="font-bold text-destructive mb-2">{error.name}: {error.message}</p>
      <pre>{error.stack}</pre>
     </div>
    )}
   </div>
   <div className="flex gap-2 mt-4">
    <Button onClick={() => reset()} variant="default">
     <RefreshCcw className="mr-2 h-4 w-4" />
     Réessayer
    </Button>
    <Button asChild variant="outline">
     <Link href="/">
      <Home className="mr-2 h-4 w-4" />
      Retour à l&apos;accueil
     </Link>
    </Button>
   </div>
  </div>
 )
}
