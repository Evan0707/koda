import Link from 'next/link'
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
 return (
  <div className="flex bg-background min-h-screen flex-col items-center justify-center p-6">
   <div className="max-w-lg w-full text-center space-y-8">
    {/* Animated 404 */}
    <div className="relative">
     <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none tracking-tighter text-foreground/5 select-none">
      404
     </h1>
     <div className="absolute inset-0 flex items-center justify-center">
      <div className="space-y-3">
       <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
        <Search className="w-8 h-8 text-primary" />
       </div>
       <p className="text-sm font-medium text-muted-foreground">Page introuvable</p>
      </div>
     </div>
    </div>

    {/* Message */}
    <div className="space-y-3">
     <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
      Oups, cette page n&apos;existe pas
     </h2>
     <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
      La page que vous cherchez a peut-être été déplacée, supprimée, ou n&apos;a jamais existé.
     </p>
    </div>

    {/* Actions */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
     <Button asChild size="lg" className="w-full sm:w-auto gap-2">
      <Link href="/">
       <Home className="w-4 h-4" />
       Retour à l&apos;accueil
      </Link>
     </Button>
     <Button asChild variant="outline" size="lg" className="w-full sm:w-auto gap-2">
      <Link href="/dashboard">
       <ArrowLeft className="w-4 h-4" />
       Tableau de bord
      </Link>
     </Button>
    </div>

    {/* Helpful links */}
    <div className="pt-4 border-t border-border">
     <p className="text-sm text-muted-foreground mb-3">Liens utiles</p>
     <div className="flex flex-wrap justify-center gap-4 text-sm">
      <Link href="/docs" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
       <BookOpen className="w-3.5 h-3.5" />
       Documentation
      </Link>
      <Link href="/aide" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
       <Search className="w-3.5 h-3.5" />
       Centre d&apos;aide
      </Link>
     </div>
    </div>
   </div>
  </div>
 )
}
