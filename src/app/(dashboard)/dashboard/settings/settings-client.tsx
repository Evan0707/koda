'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  User,
  Building2,
  Receipt,
  Lock,
  Loader2,
  Save,
  Mail,
  Phone,
  MapPin,
  Euro,
  FileText,
  Globe,
  CreditCard,
  History,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import {
  updateUserProfile,
  updateCompanyInfo,
  updateBillingPreferences,
  changePassword,
  updateStripeSettings,
  uploadAvatar,
  deleteAccount,
} from '@/lib/actions/settings'
import { getGmailStatus, disconnectGmailAccount } from '@/lib/actions/email'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'


import BillingSection from './billing-section'

type Profile = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  avatarUrl: string | null
  companyName: string | null
  companyAddress: string | null
  companyCity: string | null
  companyCountry: string | null
  companySiret: string | null
  companyVat: string | null
  defaultVatRate: number | null
  currency: string | null
  quotePrefix: string | null
  invoicePrefix: string | null
  paymentTerms: number | null
  stripePublishableKey: string | null
  stripeSecretKey: string | null
  gmailEmail: string | null
  gmailConnectedAt: Date | null
  role: 'owner' | 'admin' | 'member'
}

type SubscriptionStatus = {
  plan: 'free' | 'starter' | 'pro'
  planStatus: string | null
  stripeSubscriptionId: string | null
  commissionRate: string | null
  monthlyInvoiceCount: number | null
  cancelAtPeriodEnd: boolean
}

export default function SettingsClient({
  profile,
  subscriptionStatus
}: {
  profile: Profile | null,
  subscriptionStatus: SubscriptionStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  // Tabs filtering logic
  // member: Profile only
  // admin: Profile, Company, Billing
  // owner: All
  const [activeTab, setActiveTab] = useState('profile')
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  // Safe access to role
  // Safe access to role - effectively ignored for UI logic now as per request
  const userRole = profile?.role || 'member'

  const canManageCompany = true // ['owner', 'admin'].includes(userRole)
  const canManageBilling = true // ['owner', 'admin'].includes(userRole)
  const canManagePayments = true // ['owner'].includes(userRole)

  if (!profile) return null

  // Profile form
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateUserProfile(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profil mis à jour')
      }
    })
  }

  // Company form
  const handleCompanySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  // Billing form
  const handleBillingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  // Password form
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    // Validate password strength
    if (passwordData.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!/[A-Z]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins une majuscule')
      return
    }
    if (!/[a-z]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins une minuscule')
      return
    }
    if (!/[0-9]/.test(passwordData.new)) {
      toast.error('Le mot de passe doit contenir au moins un chiffre')
      return
    }

    startTransition(async () => {
      const result = await changePassword(passwordData.current, passwordData.new)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Mot de passe modifié')
        setPasswordData({ current: '', new: '', confirm: '' })
      }
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte et vos préférences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-background">
            <User className="w-4 h-4 mr-2" />
            Profil
          </TabsTrigger>

          {canManageCompany && (
            <TabsTrigger value="company" className="data-[state=active]:bg-background">
              <Building2 className="w-4 h-4 mr-2" />
              Entreprise
            </TabsTrigger>
          )}

          {canManageBilling && (
            <TabsTrigger value="billing" className="data-[state=active]:bg-background">
              <Receipt className="w-4 h-4 mr-2" />
              Abonnement & Facturation
            </TabsTrigger>
          )}

          <TabsTrigger value="security" className="data-[state=active]:bg-background">
            <Lock className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>

          {canManagePayments && (
            <TabsTrigger value="payments" className="data-[state=active]:bg-background">
              <CreditCard className="w-4 h-4 mr-2" />
              Paiements
            </TabsTrigger>
          )}

          <TabsTrigger value="integrations" className="data-[state=active]:bg-background">
            <Mail className="w-4 h-4 mr-2" />
            Intégrations
          </TabsTrigger>

          {canManageCompany && (
            <TabsTrigger value="audit" className="data-[state=active]:bg-background">
              <History className="w-4 h-4 mr-2" />
              Audit
            </TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Vos informations de contact et d'identité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">

                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatarUrl || ''} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Label htmlFor="avatar-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2">
                      Changer la photo
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const formData = new FormData()
                          formData.append('avatar', file)
                          startTransition(async () => {
                            const result = await uploadAvatar(formData)
                            if (result.error) {
                              toast.error(result.error)
                            } else {
                              toast.success('Photo de profil mise à jour')
                              // Optional: force reload to update all avatars immediately
                              // window.location.reload() 
                            }
                          })
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG ou GIF. Max 5Mo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={profile?.firstName || ''}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={profile?.lastName || ''}
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="pl-10 bg-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={profile?.phone || ''}
                      placeholder="+33 6 12 34 56 78"
                      className="pl-10"
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
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company">
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
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
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
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="companyAddress"
                      name="companyAddress"
                      defaultValue={profile?.companyAddress || ''}
                      placeholder="123 Rue de la Victoire"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Ville</Label>
                    <Input
                      id="companyCity"
                      name="companyCity"
                      defaultValue={profile?.companyCity || ''}
                      placeholder="75009 Paris"
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
                    <Input
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
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
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
              <form onSubmit={handleBillingSubmit} className="space-y-6">
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
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Changer le mot de passe
              </CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe régulièrement pour plus de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) => setPasswordData(p => ({ ...p, current: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(p => ({ ...p, new: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">8 caractères min., 1 majuscule, 1 minuscule, 1 chiffre</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    Modifier le mot de passe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone - Owner Only */}
          {userRole === 'owner' && (
            <Card className="mt-6 border-red-200 dark:border-red-900/50">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Zone de danger</CardTitle>
                <CardDescription>
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                  <div>
                    <p className="font-medium text-foreground">Supprimer mon compte</p>
                    <p className="text-sm text-muted-foreground">
                      Toutes vos données seront définitivement supprimées
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le compte
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          Supprimer votre compte ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
                        </AlertDialogDescription>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>Contacts et entreprises</li>
                          <li>Devis et factures</li>
                          <li>Projets et tâches</li>
                          <li>Contrats et modèles</li>
                          <li>Pipeline et opportunités</li>
                        </ul>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isDeleting}
                          onClick={async () => {
                            setIsDeleting(true)
                            const result = await deleteAccount()
                            if (result.error) {
                              toast.error(result.error)
                              setIsDeleting(false)
                            } else {
                              toast.success('Compte supprimé avec succès')
                              router.push('/')
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        {canManagePayments && (
          <TabsContent value="payments" className="space-y-6">
            {/* Stripe Connect Section - ONLY for FREE plan */}
            {subscriptionStatus.plan === 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Compte de paiement (Stripe Connect)
                  </CardTitle>
                  <CardDescription>
                    Configuration requise pour le plan Gratuit (Commission de 5%)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/20">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>Plan Gratuit :</strong> Pour accepter les paiements, vous devez connecter un compte Stripe.
                        Une commission de 5% sera automatiquement prélevée sur chaque transaction.
                        <br />
                        <span className="text-muted-foreground mt-1 block">Passez à un plan PRO pour utiliser vos propres clés API et supprimer la commission.</span>
                      </p>
                    </div>

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
                        defaultValue={profile?.stripeSecretKey || ''}
                        placeholder="sk_test_..."
                        className="font-mono text-sm"
                      />
                    </div>

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
          </TabsContent>
        )}

        {/* Integrations Tab */}
        <TabsContent value="integrations">
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
                    Vous pouvez maintenant envoyer des emails depuis l'interface KodaFlow. Ils seront envoyés depuis votre adresse Gmail.
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
        </TabsContent>

        {/* Audit Tab */}
        {canManageCompany && (
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historique d'activité
                </CardTitle>
                <CardDescription>
                  Traçabilité de toutes les actions effectuées sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Consultez l'historique complet de toutes les actions (création, modification, envoi...)
                  </p>
                  <a
                    href="/dashboard/settings/audit-logs"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Voir l'historique complet
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
