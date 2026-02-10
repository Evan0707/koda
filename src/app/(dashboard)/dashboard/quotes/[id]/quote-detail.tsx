'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    ArrowLeft,
    Printer,
    Send,
    CheckCircle,
    XCircle,
    Mail,
    Download,
    FileText,
    Link2,
    Copy,
    Pen,
} from 'lucide-react'
import { AIEmailDialog } from '@/components/ai-email-dialog'
import Link from 'next/link'
import { updateQuoteStatus } from '@/lib/actions/quotes'
import { convertQuoteToInvoice } from '@/lib/actions/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface QuoteDetailProps {
    quote: any
}

export default function QuoteDetail({ quote }: QuoteDetailProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = async (status: string) => {
        startTransition(async () => {
            const result = await updateQuoteStatus(quote.id, status)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Statut mis à jour : ${status}`)
                router.refresh()
            }
        })
    }

    const handleConversion = async () => {
        startTransition(async () => {
            const result = await convertQuoteToInvoice(quote.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Facture générée avec succès')
                router.push(`/dashboard/invoices/${result.id}`)
            }
        })
    }

    const handlePrint = () => {
        window.print()
    }

    const handleCopySignatureLink = () => {
        const baseUrl = window.location.origin
        const signatureLink = `${baseUrl}/quote/${quote.id}`
        navigator.clipboard.writeText(signatureLink)
        toast.success('Lien de signature copié !')
    }

    const formatPrice = (cents: number) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
        }).format(cents / 100)
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 print:p-0 print:max-w-none">
            {/* Action Bar - Hidden in Print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/quotes"
                        className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{quote.number}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                ${quote.status === 'draft' ? 'bg-muted text-muted-foreground' : ''}
                ${quote.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : ''}
                ${quote.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''}
                ${quote.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}
             `}>
                            {quote.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer / PDF
                    </Button>

                    <AIEmailDialog type="quote" id={quote.id} />

                    {quote.status !== 'signed' && quote.status !== 'accepted' && (
                        <Button variant="outline" onClick={handleCopySignatureLink}>
                            <Pen className="w-4 h-4 mr-2" />
                            Lien Signature
                        </Button>
                    )}

                    {quote.status === 'draft' && (
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleStatusChange('sent')}
                            disabled={isPending}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Marquer Envoyé
                        </Button>
                    )}

                    {quote.status === 'sent' && (
                        <>
                            <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleStatusChange('accepted')}
                                disabled={isPending}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accepter
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleStatusChange('rejected')}
                                disabled={isPending}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Refuser
                            </Button>
                        </>
                    )}

                    {quote.status === 'accepted' && (
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90"
                            onClick={handleConversion}
                            disabled={isPending}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Convertir en Facture
                        </Button>
                    )}
                </div>
            </div>

            {/* Document View */}
            <Card className="p-8 md:p-12 shadow-md print:shadow-none print:border-none print:p-0 bg-card">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        {/* Logo Placeholder */}
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                            <span className="text-primary-foreground font-bold text-xl">K</span>
                        </div>
                        <h2 className="text-lg font-bold text-foreground">KodaFlow</h2>
                        <div className="text-sm text-muted-foreground mt-1">
                            <p>123 Avenue de l'Innovation</p>
                            <p>75011 Paris, France</p>
                            <p>contact@kodaflow.com</p>
                            <p>SIRET: 123 456 789 00012</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h1 className="text-4xl font-light text-foreground mb-2">DEVIS</h1>
                        <p className="font-mono text-muted-foreground">#{quote.number}</p>
                        <div className="mt-4 text-sm text-muted-foreground">
                            <p><span className="font-medium">Date :</span> {formatDate(quote.issueDate)}</p>
                            {quote.validUntil && (
                                <p><span className="font-medium">Valide jusqu'au :</span> {formatDate(quote.validUntil)}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="border-t border-b border-border py-8 mb-12">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Émis pour</h3>
                            <div className="text-foreground font-medium">
                                {quote.company ? (
                                    <>
                                        <p className="text-lg">{quote.company.name}</p>
                                        <div className="text-sm text-muted-foreground font-normal mt-1 whitespace-pre-line">
                                            {quote.company.address}
                                            {quote.company.address && <br />}
                                            {quote.company.postal_code} {quote.company.city}
                                            {quote.company.country && <br />}
                                            {quote.company.country}
                                        </div>
                                    </>
                                ) : quote.contact ? (
                                    <>
                                        <p className="text-lg">{quote.contact.firstName} {quote.contact.lastName}</p>
                                        <div className="text-sm text-muted-foreground font-normal mt-1">
                                            {quote.contact.email}
                                            {quote.contact.phone && <br />}
                                            {quote.contact.phone}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-500">Client introuvable</p>
                                )}
                            </div>
                        </div>
                        <div>
                            {quote.title && (
                                <>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Objet</h3>
                                    <p className="text-foreground">{quote.title}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-12">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-1/2">Description</th>
                                <th className="py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qté</th>
                                <th className="py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prix U. HT</th>
                                <th className="py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">TVA</th>
                                <th className="py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total HT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {quote.items.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-4 text-sm text-foreground">
                                        <p className="font-medium whitespace-pre-line">{item.description}</p>
                                    </td>
                                    <td className="py-4 text-sm text-muted-foreground text-right">{item.quantity}</td>
                                    <td className="py-4 text-sm text-muted-foreground text-right">{formatPrice(item.unitPrice)}</td>
                                    <td className="py-4 text-sm text-muted-foreground text-right">{item.vatRate}%</td>
                                    <td className="py-4 text-sm font-medium text-foreground text-right">
                                        {formatPrice(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Total HT</span>
                            <span>{formatPrice(quote.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>TVA (20%)</span>
                            <span>{formatPrice(quote.vatAmount)}</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                            <span>Total TTC</span>
                            <span>{formatPrice(quote.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-8 text-xs text-muted-foreground text-center">
                    <p className="mb-2">Merci de votre confiance.</p>
                    <p>Conditions de paiement : 30 jours fin de mois. En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.</p>
                </div>

            </Card>

            {/* Print Styles Override */}
            <style jsx global>{`
        @media print {
            @page {
                margin: 0;
            }
            body {
                background: white;
            }
            nav, aside, header {
                display: none !important;
            }
            .print\\:hidden {
                display: none !important;
            }
        }
      `}</style>
        </div>
    )
}
