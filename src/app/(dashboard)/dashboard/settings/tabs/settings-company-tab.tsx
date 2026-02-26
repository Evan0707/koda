'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Building2, Loader2, Save, MapPin, Globe } from 'lucide-react'
import { updateCompanyInfo } from '@/lib/actions/settings'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'
import { SiretInput } from '@/components/ui/siret-input'

type CompanyInfo = {
  companyName: string | null
  companyAddress: string | null
  companyPostalCode: string | null
  companyCity: string | null
  companyCountry: string | null
  companySiret: string | null
  companyVat: string | null
}

export default function SettingsCompanyTab({ profile }: { profile: CompanyInfo }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateCompanyInfo(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Informations entreprise mises à jour')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Informations entreprise
        </CardTitle>
        <CardDescription>
          Ces informations apparaîtront sur vos devis et factures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={profile?.companyName || ''}
              placeholder="Ma Super Entreprise SARL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Adresse</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
              <AddressAutocomplete
                id="companyAddress"
                name="companyAddress"
                defaultValue={profile?.companyAddress || ''}
                placeholder="123 Rue de la Victoire"
                className="pl-10"
                onAddressSelect={(address) => {
                  const postalCodeInput = document.getElementById('companyPostalCode') as HTMLInputElement
                  if (postalCodeInput) {
                    postalCodeInput.value = address.postcode
                  }
                  const cityInput = document.getElementById('companyCity') as HTMLInputElement
                  if (cityInput) {
                    cityInput.value = address.city
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyPostalCode">Code Postal</Label>
              <Input
                id="companyPostalCode"
                name="companyPostalCode"
                defaultValue={profile?.companyPostalCode || ''}
                placeholder="75009"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">Ville</Label>
              <Input
                id="companyCity"
                name="companyCity"
                defaultValue={profile?.companyCity || ''}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCountry">Pays</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="companyCountry"
                  name="companyCountry"
                  defaultValue={profile?.companyCountry || 'France'}
                  placeholder="France"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companySiret">SIRET</Label>
              <SiretInput
                id="companySiret"
                name="companySiret"
                defaultValue={profile?.companySiret || ''}
                placeholder="123 456 789 00012"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyVat">N° TVA Intracommunautaire</Label>
              <Input
                id="companyVat"
                name="companyVat"
                defaultValue={profile?.companyVat || ''}
                placeholder="FR12345678901"
              />
            </div>
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
  )
}
