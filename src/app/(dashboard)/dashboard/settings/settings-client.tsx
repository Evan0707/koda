'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Building2,
  Receipt,
  Lock,
  FileText,
  CreditCard,
  History,
  Hash,
  Mail,
} from 'lucide-react'

import SettingsProfileTab from './tabs/settings-profile-tab'
import SettingsCompanyTab from './tabs/settings-company-tab'
import SettingsBillingTab from './tabs/settings-billing-tab'
import SettingsNumberingTab from './tabs/settings-numbering-tab'
import SettingsEmailTemplatesTab from './tabs/settings-email-templates-tab'
import SettingsSecurityTab from './tabs/settings-security-tab'
import SettingsPaymentsTab from './tabs/settings-payments-tab'
import SettingsIntegrationsTab from './tabs/settings-integrations-tab'
import SettingsAuditTab from './tabs/settings-audit-tab'

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
  companyPostalCode: string | null
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
  subscriptionStatus,
}: {
  profile: Profile | null
  subscriptionStatus: SubscriptionStatus
}) {
  const [activeTab, setActiveTab] = useState('profile')

  const userRole = profile?.role || 'member'
  const canManageCompany = true
  const canManageBilling = true
  const canManagePayments = true

  if (!profile) return null

  return (
    <div className="space-y-6 animate-fade-in">
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

          {canManageCompany && (
            <TabsTrigger value="numbering" className="data-[state=active]:bg-background">
              <Hash className="w-4 h-4 mr-2" />
              Numérotation
            </TabsTrigger>
          )}

          {canManageCompany && (
            <TabsTrigger value="email-templates" className="data-[state=active]:bg-background">
              <FileText className="w-4 h-4 mr-2" />
              Emails
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

        <TabsContent value="profile">
          <SettingsProfileTab profile={profile} />
        </TabsContent>

        <TabsContent value="company">
          <SettingsCompanyTab profile={profile} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <SettingsBillingTab profile={profile} subscriptionStatus={subscriptionStatus} />
        </TabsContent>

        {canManageCompany && (
          <TabsContent value="email-templates">
            <SettingsEmailTemplatesTab />
          </TabsContent>
        )}

        {canManageCompany && (
          <TabsContent value="numbering">
            <SettingsNumberingTab />
          </TabsContent>
        )}

        <TabsContent value="security">
          <SettingsSecurityTab userRole={userRole} />
        </TabsContent>

        {canManagePayments && (
          <TabsContent value="payments">
            <SettingsPaymentsTab profile={profile} subscriptionStatus={subscriptionStatus} />
          </TabsContent>
        )}

        <TabsContent value="integrations">
          <SettingsIntegrationsTab profile={profile} />
        </TabsContent>

        {canManageCompany && (
          <TabsContent value="audit">
            <SettingsAuditTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
