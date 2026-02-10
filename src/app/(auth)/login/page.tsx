'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
 const router = useRouter()
 const supabase = createClient()

 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [magicLinkSent, setMagicLinkSent] = useState(false)

 const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
   const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
   })

   if (error) {
    toast.error(error.message)
    return
   }

   toast.success('Connexion réussie !')
   router.push('/dashboard')
   router.refresh()
  } catch {
   toast.error('Une erreur est survenue')
  } finally {
   setLoading(false)
  }
 }

 const handleMagicLink = async () => {
  if (!email) {
   toast.error('Veuillez entrer votre email')
   return
  }

  setLoading(true)
  try {
   const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
     emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
   })

   if (error) {
    toast.error(error.message)
    return
   }

   setMagicLinkSent(true)
   toast.success('Lien de connexion envoyé !')
  } catch {
   toast.error('Une erreur est survenue')
  } finally {
   setLoading(false)
  }
 }

 if (magicLinkSent) {
  return (
   <div className="text-center">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
     <Mail className="w-8 h-8 text-primary" />
    </div>
    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Vérifiez vos emails</h2>
    <p className="text-muted-foreground mb-6">
     Un lien de connexion a été envoyé à <span className="text-foreground font-medium">{email}</span>
    </p>
    <Button
     variant="ghost"
     className="text-primary hover:text-primary/90"
     onClick={() => setMagicLinkSent(false)}
    >
     Utiliser un autre email
    </Button>
   </div>
  )
 }

 return (
  <div>
   <div className="text-center mb-8">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">Bon retour parmi nous</h2>
    <p className="text-sm text-muted-foreground mt-2">
     Entrez vos identifiants pour accéder à votre espace
    </p>
   </div>

   <form onSubmit={handleLogin} className="space-y-4">
    <div className="space-y-2">
     <Label htmlFor="email">Email</Label>
     <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="email"
       type="email"
       placeholder="vous@example.com"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       className="pl-10"
       required
      />
     </div>
    </div>

    <div className="space-y-2">
     <div className="flex items-center justify-between">
      <Label htmlFor="password">Mot de passe</Label>
      <Link href="/forgot-password" className="text-xs text-primary hover:underline">
       Oublié ?
      </Link>
     </div>
     <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="password"
       type="password"
       placeholder="••••••••"
       value={password}
       onChange={(e) => setPassword(e.target.value)}
       className="pl-10"
       required
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
       Se connecter
       <ArrowRight className="w-4 h-4 ml-2" />
      </>
     )}
    </Button>
   </form>

   <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
     <div className="w-full border-t border-border"></div>
    </div>
    <div className="relative flex justify-center text-xs uppercase">
     <span className="bg-background px-2 text-muted-foreground rounded-full border border-border">
      Ou continuer avec
     </span>
    </div>
   </div>

   <div className="grid gap-2">
    <Button
     variant="outline"
     className="w-full"
     onClick={handleMagicLink}
     disabled={loading}
    >
     <Mail className="w-4 h-4 mr-2" />
     Magic Link
    </Button>
    {/* Additional social buttons could go here */}
   </div>

   <p className="text-center text-sm text-muted-foreground mt-6">
    Pas encore de compte ?{' '}
    <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4">
     S&apos;inscrire
    </Link>
   </p>
  </div>
 )
}
