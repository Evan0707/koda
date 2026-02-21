'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate } from './project-hub-types'
import { Quote, Company, Contact } from '@/types/db'

type LinkedQuote = Quote & { items: any[]; company: Company | null; contact: Contact | null }

export default function ProjectQuoteTab({ quote }: { quote: LinkedQuote }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Devis associé</h2>
        <Link href={`/dashboard/quotes/${quote.id}`}>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Ouvrir le devis
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{quote.number}</h3>
            {quote.title && <p className="text-muted-foreground mt-1">{quote.title}</p>}
            <div className="flex items-center gap-3 mt-3">
              <Badge className={`text-xs ${
                quote.status === 'signed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                quote.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                'bg-muted text-muted-foreground'
              }`}>
                {quote.status === 'signed' ? 'Signé' : quote.status === 'sent' ? 'Envoyé' : quote.status === 'draft' ? 'Brouillon' : quote.status}
              </Badge>
              {quote.issueDate && (
                <span className="text-sm text-muted-foreground">émis le {formatDate(quote.issueDate)}</span>
              )}
              {quote.validUntil && (
                <span className="text-sm text-muted-foreground">Valide jusqu&apos;au {formatDate(quote.validUntil)}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(quote.total || 0)}</p>
            {(quote.subtotal !== quote.total) && (
              <p className="text-sm text-muted-foreground">HT: {formatCurrency(quote.subtotal || 0)}</p>
            )}
          </div>
        </div>

        {/* Quote items */}
        {quote.items && quote.items.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Lignes du devis</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground uppercase">Description</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase">Qté</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase">Prix unit.</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-sm text-foreground">{item.description}</td>
                    <td className="py-2 text-sm text-muted-foreground text-right">{item.quantity}</td>
                    <td className="py-2 text-sm text-muted-foreground text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-sm text-foreground text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
