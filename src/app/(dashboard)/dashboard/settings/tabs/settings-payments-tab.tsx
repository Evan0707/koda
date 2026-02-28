'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CreditCard, Loader2, Save, CheckCircle2, ExternalLink } from 'lucide-react'
import { updateStripeSettings } from '@/lib/actions/settings'

type PaymentsProfile = {
  stripePublishableKey: string | null
  stripeSecretKey: string | null
}

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'pro'
}

export default function SettingsPaymentsTab({
  profile,
  subscriptionStatus,
}: {
  profile: PaymentsProfile
  subscriptionStatus: SubscriptionStatus
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Configuration Stripe (Clés API)
          </CardTitle>
          <CardDescription>
            Configuration de vos propres clés pour encaisser les paiements (0% de commission supplémentaire)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              startTransition(async () => {
                const result = await updateStripeSettings(formData)
                if (result.error) {
                  toast.error(result.error)
                } else {
                  toast.success('Configuration Stripe mise à jour')
                }
              })
            }}
            className="space-y-6"
          >
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Vous utilisez vos propres clés API Stripe.
                Vous encaissez 100% des paiements directement sur votre compte Stripe.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Trouvez vos clés sur{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                  dashboard.stripe.com/apikeys <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripePublishableKey">Clé Publique (Publishable Key)</Label>
              <Input
                id="stripePublishableKey"
                name="stripePublishableKey"
                defaultValue={profile?.stripePublishableKey || ''}
                placeholder="pk_test_... ou pk_live_..."
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stripeSecretKey">Clé Secrète (Secret Key)</Label>
              <Input
                id="stripeSecretKey"
                name="stripeSecretKey"
                type="password"
                placeholder={profile?.stripeSecretKey ? '••••••••••••••••••••' : 'sk_test_... ou sk_live_...'}
                className="font-mono text-sm"
              />
              {profile?.stripeSecretKey && (
                <p className="text-xs text-muted-foreground">Clé configurée ({profile.stripeSecretKey}). Laissez vide pour conserver la clé actuelle.</p>
              )}
            </div>

            {/* Visual indicator of key status */}
            {profile?.stripePublishableKey && profile?.stripeSecretKey && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Clés API configurées
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
