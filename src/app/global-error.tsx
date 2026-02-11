'use client'

import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw } from 'lucide-react'

const inter = Inter({
 subsets: ["latin"],
 variable: "--font-inter",
});

export default function GlobalError({
 error,
 reset,
}: {
 error: Error & { digest?: string }
 reset: () => void
}) {
 return (
  <html lang="fr">
   <body className={`${inter.variable} font-sans antialiased`}>
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-6 bg-background text-foreground">
     <div className="rounded-full bg-destructive/10 p-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
     </div>
     <div className="space-y-2">
      <h2 className="text-3xl font-bold tracking-tighter">Erreur Critique</h2>
      <p className="max-w-[600px] text-muted-foreground">
       Une erreur critique est survenue et l&apos;application ne peut pas s&apos;afficher correctement.
      </p>
     </div>
     <Button onClick={() => reset()} variant="default">
      <RefreshCcw className="mr-2 h-4 w-4" />
      Récharger l&apos;application
     </Button>
    </div>
   </body>
  </html>
 )
}
