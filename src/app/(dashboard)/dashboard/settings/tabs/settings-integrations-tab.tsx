'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, Loader2 } from 'lucide-react'
import { disconnectGmailAccount } from '@/lib/actions/email'

type IntegrationsProfile = {
  gmailEmail: string | null
  gmailConnectedAt: Date | null
}

export default function SettingsIntegrationsTab({ profile }: { profile: IntegrationsProfile }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Connexion Email
        </CardTitle>
        <CardDescription>
          Connectez votre compte Gmail pour envoyer des factures et devis directement depuis votre adresse email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {profile?.gmailEmail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-300">Gmail connecté</p>
                <p className="text-sm text-green-600 dark:text-green-400">{profile.gmailEmail}</p>
              </div>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => {
                  startTransition(async () => {
                    const result = await disconnectGmailAccount()
                    if (result.success) {
                      toast.success('Gmail déconnecté')
                      window.location.reload()
                    } else {
                      toast.error(result.error || 'Erreur')
                    }
                  })
                }}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Déconnecter'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Vous pouvez maintenant envoyer des emails depuis l&apos;interface KodaFlow. Ils seront envoyés depuis votre adresse Gmail.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 border rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Google Gmail</p>
                  <p className="text-sm text-muted-foreground">Envoyez des emails depuis votre adresse Gmail</p>
                </div>
                <Button
                  asChild
                  className="bg-[#4285F4] hover:bg-[#3367D6] text-white"
                >
                  <a href="/api/auth/gmail">Connecter Gmail</a>
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>En connectant votre compte Gmail, vous pourrez :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground/80">
                <li>Envoyer des factures directement aux clients</li>
                <li>Envoyer des devis avec pièces jointes PDF</li>
                <li>Recevoir les réponses dans votre boîte Gmail</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
