'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Receipt, Euro, FileText, Loader2, Save } from 'lucide-react'
import { updateBillingPreferences } from '@/lib/actions/settings'
import BillingSection from '../billing-section'

type BillingProfile = {
  defaultVatRate: number | null
  currency: string | null
  quotePrefix: string | null
  invoicePrefix: string | null
  paymentTerms: number | null
}

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'pro'
  planStatus: string | null
  stripeSubscriptionId: string | null
  commissionRate: string | null
  monthlyInvoiceCount: number | null
  cancelAtPeriodEnd: boolean
  isTrialing?: boolean
  trialEnd?: Date | null
  billingPeriod?: 'monthly' | 'annual'
}

export default function SettingsBillingTab({
  profile,
  subscriptionStatus,
}: {
  profile: BillingProfile
  subscriptionStatus: SubscriptionStatus
}) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateBillingPreferences(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Préférences de facturation mises à jour')
      }
    })
  }

  return (
    <div className="space-y-6">
      <BillingSection subscriptionStatus={subscriptionStatus} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Préférences de facturation
          </CardTitle>
          <CardDescription>
            Paramètres par défaut pour vos devis et factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultVatRate">Taux de TVA par défaut (%)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="defaultVatRate"
                    name="defaultVatRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue={profile?.defaultVatRate || 20}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={profile?.currency || 'EUR'}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quotePrefix">Préfixe des devis</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="quotePrefix"
                    name="quotePrefix"
                    defaultValue={profile?.quotePrefix || 'DEV-'}
                    placeholder="DEV-"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Ex: DEV-2024-001</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Préfixe des factures</Label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="invoicePrefix"
                    name="invoicePrefix"
                    defaultValue={profile?.invoicePrefix || 'FAC-'}
                    placeholder="FAC-"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Ex: FAC-2024-001</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Délai de paiement (jours)</Label>
              <Input
                id="paymentTerms"
                name="paymentTerms"
                type="number"
                min="0"
                max="365"
                defaultValue={profile?.paymentTerms || 30}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">Nombre de jours par défaut pour le règlement des factures</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
