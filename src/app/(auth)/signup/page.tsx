'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { signUpAction } from '@/lib/actions/auth'

export default function SignupPage() {
 const router = useRouter()

 const [loading, setLoading] = useState(false)

 const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setLoading(true)

  const formData = new FormData(e.currentTarget)
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
   toast.error('Les mots de passe ne correspondent pas')
   setLoading(false)
   return
  }

  if (password.length < 8) {
   toast.error('Le mot de passe doit contenir au moins 8 caract\u00e8res')
   setLoading(false)
   return
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
   toast.error('Le mot de passe doit contenir une majuscule, une minuscule et un chiffre')
   setLoading(false)
   return
  }

  try {
   const result = await signUpAction(formData)

   if (result?.error) {
    toast.error(result.error)
    return
   }

   if (result?.success) {
    toast.success(result.success)
    // Redirect to a specific "check email" page or login
    router.push('/login?verified=false')
   }
  } catch {
   toast.error('Une erreur est survenue')
  } finally {
   setLoading(false)
  }
 }

 return (
  <div>
   <div className="text-center mb-8">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">Créer un compte</h2>
    <p className="text-sm text-muted-foreground mt-2">
     Commencez l'aventure KodaFlow gratuitement
    </p>
   </div>

   <form onSubmit={handleSignup} className="space-y-4">
    <div className="space-y-2">
     <Label htmlFor="email">Email</Label>
     <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="email"
       name="email"
       type="email"
       placeholder="vous@example.com"
       className="pl-10"
       required
      />
     </div>
    </div>

    <div className="space-y-2">
     <Label htmlFor="password">Mot de passe</Label>
     <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="password"
       name="password"
       type="password"
       placeholder="••••••••"
       className="pl-10"
       required
       minLength={8}
      />
     </div>
    </div>

    <div className="space-y-2">
     <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
     <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="confirmPassword"
       name="confirmPassword"
       type="password"
       placeholder="••••••••"
       className="pl-10"
       required
       minLength={8}
      />
     </div>
    </div>

    <Button
     type="submit"
     className="w-full"
     disabled={loading}
    >
     {loading ? (
      <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
      <>
       Créer mon compte
       <ArrowRight className="w-4 h-4 ml-2" />
      </>
     )}
    </Button>

    <p className="text-xs text-muted-foreground text-center mt-3">
     En créant un compte, vous acceptez nos{' '}
     <Link href="/legal/cgv" className="underline underline-offset-2 hover:text-foreground">
      CGV/CGU
     </Link>{' '}
     et notre{' '}
     <Link href="/legal/confidentialite" className="underline underline-offset-2 hover:text-foreground">
      Politique de confidentialité
     </Link>.
    </p>
   </form>

   <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
     <div className="w-full border-t border-border"></div>
    </div>
    <div className="relative flex justify-center text-xs uppercase">
     <span className="bg-background px-2 text-muted-foreground rounded-full border border-border">
      Ou
     </span>
    </div>
   </div>

   <p className="text-center text-sm text-muted-foreground mt-6">
    Déjà un compte ?{' '}
    <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
     Se connecter
    </Link>
   </p>
  </div>
 )
}
