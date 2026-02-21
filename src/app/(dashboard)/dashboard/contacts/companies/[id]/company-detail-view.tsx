'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, type StatusConfig } from '@/components/status-badge'
import { formatPrice } from '@/lib/currency'
import {
  Building2,
  Globe,
  MapPin,
  Users,
  FileText,
  Receipt,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

const invoiceStatusConfig: Record<string, StatusConfig> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyée', variant: 'blue' },
  paid: { label: 'Payée', variant: 'green' },
  overdue: { label: 'En retard', variant: 'red' },
  cancelled: { label: 'Annulée', variant: 'muted' },
}

const quoteStatusConfig: Record<string, StatusConfig> = {
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyé', variant: 'blue' },
  signed: { label: 'Signé', variant: 'green' },
  rejected: { label: 'Refusé', variant: 'red' },
  expired: { label: 'Expiré', variant: 'muted' },
}

type Props = {
  company: any
  contacts: any[]
  invoices: any[]
  quotes: any[]
}

export function CompanyDetailView({ company, contacts, invoices, quotes }: Props) {
  // Compute revenue stats
  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
  const totalPaid = invoices
    .filter((inv: any) => inv.status === 'paid')
    .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
  const totalQuoted = quotes.reduce((sum: number, q: any) => sum + (q.total || 0), 0)

  const sizeLabels: Record<string, string> = {
    startup: 'Startup',
    pme: 'PME',
    eti: 'ETI',
    ge: 'Grand Groupe',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {company.industry && (
                <Badge variant="secondary">{company.industry}</Badge>
              )}
              {company.size && (
                <Badge variant="outline">{sizeLabels[company.size] || company.size}</Badge>
              )}
              {company.city && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {company.city}{company.country ? `, ${company.country}` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {company.website && (
          <a href={company.website} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Globe className="w-4 h-4 mr-2" />
              Site web
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>
        )}
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CA Encaissé</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Facturé</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(totalInvoiced)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Devisé</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(totalQuoted)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {company.address && (
              <div>
                <p className="text-muted-foreground">Adresse</p>
                <p className="font-medium">{company.address}</p>
              </div>
            )}
            {company.postalCode && (
              <div>
                <p className="text-muted-foreground">Code postal</p>
                <p className="font-medium">{company.postalCode}</p>
              </div>
            )}
            {company.siret && (
              <div>
                <p className="text-muted-foreground">SIRET</p>
                <p className="font-medium font-mono">{company.siret}</p>
              </div>
            )}
            {company.vatNumber && (
              <div>
                <p className="text-muted-foreground">N° TVA</p>
                <p className="font-medium font-mono">{company.vatNumber}</p>
              </div>
            )}
            {company.linkedinUrl && (
              <div>
                <p className="text-muted-foreground">LinkedIn</p>
                <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  Voir le profil
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contacts ({contacts.length})
          </CardTitle>
          <CardDescription>Personnes associées à cette entreprise</CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun contact lié</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact: any) => (
                <Link
                  key={contact.id}
                  href={`/dashboard/contacts/${contact.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    )}
                  </div>
                  {contact.jobTitle && (
                    <Badge variant="secondary">{contact.jobTitle}</Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Factures ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune facture</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{inv.number}</span>
                    <StatusBadge status={inv.status} statusConfig={invoiceStatusConfig} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(inv.total)}</p>
                    {inv.issueDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.issueDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Devis ({quotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun devis</p>
          ) : (
            <div className="space-y-2">
              {quotes.map((q: any) => (
                <Link
                  key={q.id}
                  href={`/dashboard/quotes/${q.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{q.number}</span>
                    <StatusBadge status={q.status} statusConfig={quoteStatusConfig} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(q.total)}</p>
                    {q.issueDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(q.issueDate).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
