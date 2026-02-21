'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, CreditCard, Loader2, Save, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'
import { updateStripeSettings } from '@/lib/actions/settings'
import { Badge } from '@/components/ui/badge'

type PaymentsProfile = {
  stripePublishableKey: string | null
  stripeSecretKey: string | null
}

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'pro'
}

type ConnectStatus = {
  isConnected?: boolean
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  email?: string | null
  error?: string
}

export default function SettingsPaymentsTab({
  profile,
  subscriptionStatus,
}: {
  profile: PaymentsProfile
  subscriptionStatus: SubscriptionStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  // Load Stripe Connect status for free plan
  useEffect(() => {
    if (subscriptionStatus.plan === 'free') {
      setIsLoadingStatus(true)
      import('@/lib/actions/stripe-connect').then(({ getStripeConnectStatus }) => {
        getStripeConnectStatus().then((status) => {
          setConnectStatus(status)
          setIsLoadingStatus(false)
        })
      })
    }
  }, [subscriptionStatus.plan])

  const getConnectStatusDisplay = () => {
    if (isLoadingStatus) return { icon: Loader2, label: 'Chargement...', color: 'text-muted-foreground', variant: 'outline' as const }
    if (!connectStatus || !connectStatus.isConnected) return { icon: AlertCircle, label: 'Non connecté', color: 'text-orange-600', variant: 'outline' as const }
    if (connectStatus.chargesEnabled && connectStatus.payoutsEnabled) return { icon: CheckCircle2, label: 'Actif', color: 'text-green-600', variant: 'default' as const }
    return { icon: Clock, label: 'En cours de vérification', color: 'text-yellow-600', variant: 'outline' as const }
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connect Section - ONLY for FREE plan */}
      {subscriptionStatus.plan === 'free' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Compte de paiement (Stripe Connect)
                </CardTitle>
                <CardDescription>
                  Configuration requise pour le plan Gratuit (Commission de 5%)
                </CardDescription>
              </div>
              {/* Status badge */}
              {(() => {
                const status = getConnectStatusDisplay()
                const StatusIcon = status.icon
                return (
                  <Badge variant={status.variant} className={`flex items-center gap-1.5 ${status.color}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                    {status.label}
                  </Badge>
                )
              })()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status details when connected */}
              {connectStatus?.isConnected && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">Compte Stripe connecté</p>
                      {connectStatus.email && (
                        <p className="text-xs text-green-700 dark:text-green-400">{connectStatus.email}</p>
                      )}
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs flex items-center gap-1">
                          {connectStatus.chargesEnabled ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-yellow-600" />
                          )}
                          Paiements
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          {connectStatus.payoutsEnabled ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-yellow-600" />
                          )}
                          Virements
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Not connected warning */}
              {!connectStatus?.isConnected && !isLoadingStatus && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Plan Gratuit :</strong> Pour accepter les paiements, vous devez connecter un compte Stripe.
                    Une commission de 5% sera automatiquement prélevée sur chaque transaction.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Passez à un plan payant pour utiliser vos propres clés API et supprimer la commission.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                {connectStatus?.isConnected ? (
                  <Button
                    onClick={() => {
                      startTransition(async () => {
                        const { getConnectDashboardLink } = await import('@/lib/actions/stripe-connect')
                        const result = await getConnectDashboardLink()
                        if (result.error) {
                          toast.error(result.error)
                        } else if (result.url) {
                          window.open(result.url, '_blank')
                        }
                      })
                    }}
                    disabled={isPending}
                    variant="outline"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                    Accéder au tableau de bord Stripe
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      startTransition(async () => {
                        const { createConnectAccount } = await import('@/lib/actions/stripe-connect')
                        const result = await createConnectAccount()
                        if (result.error) {
                          toast.error(result.error)
                        } else if (result.url) {
                          window.location.href = result.url
                        }
                      })
                    }}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Connecter mon compte Stripe
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Configuration - ONLY for Paid plans */}
      {subscriptionStatus.plan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Configuration Stripe (Clés API)
            </CardTitle>
            <CardDescription>
              Configuration experte pour les plans Starter & Pro (0% commission)
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
                  <strong>Mode Expert :</strong> Vous utilisez vos propres clés API Stripe.
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
                  placeholder="pk_test_..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey">Clé Secrète (Secret Key)</Label>
                <Input
                  id="stripeSecretKey"
                  name="stripeSecretKey"
                  type="password"
                  placeholder={profile?.stripeSecretKey ? '••••••••••••••••••••' : 'sk_test_...'}
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
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
