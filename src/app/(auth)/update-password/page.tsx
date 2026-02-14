'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, Loader2, CheckCircle2 } from 'lucide-react'

export default function UpdatePasswordPage() {
 const router = useRouter()
 const supabase = createClient()
 const [password, setPassword] = useState('')
 const [confirmPassword, setConfirmPassword] = useState('')
 const [loading, setLoading] = useState(false)

 // Verify session on mount
 useEffect(() => {
  const checkSession = async () => {
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) {
    // If no session (e.g. link expired or not clicked), redirect to login
    toast.error('Session invalide ou expirée')
    router.push('/login')
   }
  }
  checkSession()
 }, [supabase, router])

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (password !== confirmPassword) {
   toast.error('Les mots de passe ne correspondent pas')
   return
  }

  // Validate password strength
  if (password.length < 8) {
   toast.error('Le mot de passe doit contenir au moins 8 caractères')
   return
  }
  if (!/[A-Z]/.test(password)) {
   toast.error('Le mot de passe doit contenir au moins une majuscule')
   return
  }
  if (!/[a-z]/.test(password)) {
   toast.error('Le mot de passe doit contenir au moins une minuscule')
   return
  }
  if (!/[0-9]/.test(password)) {
   toast.error('Le mot de passe doit contenir au moins un chiffre')
   return
  }

  setLoading(true)

  try {
   const { error } = await supabase.auth.updateUser({
    password: password
   })

   if (error) {
    toast.error(error.message)
    return
   }

   toast.success('Mot de passe mis à jour !')
   router.push('/dashboard')
  } catch {
   toast.error('Une erreur est survenue')
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="animate-fade-in">
   <div className="text-center mb-8">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">Nouveau mot de passe</h2>
    <p className="text-sm text-muted-foreground mt-2">
     Choisissez un mot de passe sécurisé pour votre compte
    </p>
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
    <div className="space-y-2">
     <Label htmlFor="password">Nouveau mot de passe</Label>
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
       minLength={6}
      />
     </div>
    </div>

    <div className="space-y-2">
     <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
     <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
       id="confirmPassword"
       type="password"
       placeholder="••••••••"
       value={confirmPassword}
       onChange={(e) => setConfirmPassword(e.target.value)}
       className="pl-10"
       required
       minLength={6}
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
      'Mettre à jour le mot de passe'
     )}
    </Button>
   </form>
  </div>
 )
}
