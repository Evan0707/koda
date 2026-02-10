'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPasswordForEmail } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
 const router = useRouter()
 const [email, setEmail] = useState('')
 const [loading, setLoading] = useState(false)
 const [sent, setSent] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  const formData = new FormData()
  formData.append('email', email)

  const result = await resetPasswordForEmail(formData)

  setLoading(false)

  if (result?.error) {
   toast.error(result.error)
   return
  }

  setSent(true)
  toast.success('Email envoyé !')
 }

 if (sent) {
  return (
   <div className="text-center animate-fade-in">
    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
     <CheckCircle2 className="w-8 h-8 text-primary" />
    </div>
    <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Vérifiez vos emails</h2>
    <p className="text-muted-foreground mb-6">
     Si un compte existe pour <span className="text-foreground font-medium">{email}</span>,
     vous recevrez un lien pour réinitialiser votre mot de passe.
    </p>
    <div className="flex flex-col gap-3">
     <Button
      variant="outline"
      onClick={() => setSent(false)}
      className="w-full"
     >
      Renvoyer l&apos;email
     </Button>
     <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      Retour à la connexion
     </Link>
    </div>
   </div>
  )
 }

 return (
  <div className="animate-fade-in">
   <div className="text-center mb-8">
    <h2 className="text-2xl font-bold tracking-tight text-foreground">Mot de passe oublié ?</h2>
    <p className="text-sm text-muted-foreground mt-2">
     Entrez votre email pour recevoir un lien de réinitialisation
    </p>
   </div>

   <form onSubmit={handleSubmit} className="space-y-4">
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

    <Button
     type="submit"
     className="w-full"
     disabled={loading}
    >
     {loading ? (
      <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
      'Envoyer le lien'
     )}
    </Button>
   </form>

   <p className="text-center text-sm text-muted-foreground mt-6">
    <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4 flex items-center justify-center gap-2">
     <ArrowLeft className="w-4 h-4" />
     Retour à la connexion
    </Link>
   </p>
  </div>
 )
}
