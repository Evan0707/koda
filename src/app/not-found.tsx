import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
 return (
  <div className="flex bg-background min-h-screen flex-col items-center justify-center gap-4 text-center p-4">
   <div className="rounded-full bg-muted p-4">
    <FileQuestion className="h-12 w-12 text-muted-foreground" />
   </div>
   <div className="space-y-2">
    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">Page introuvable</h1>
    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
     Désolé, nous n&apos;avons pas trouvé la page que vous cherchez. Elle a peut-être été déplacée ou supprimée.
    </p>
   </div>
   <div className="flex gap-2">
    <Button asChild variant="default">
     <Link href="/">
      <Home className="mr-2 h-4 w-4" />
      Retour à l&apos;accueil
     </Link>
    </Button>
    <Button asChild variant="outline">
     <Link href="/dashboard">
      Aller au tableau de bord
     </Link>
    </Button>
   </div>
  </div>
 )
}
