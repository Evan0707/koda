'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    ArrowLeft,
    Printer,
    Send,
    CreditCard,
    Link2,
} from 'lucide-react'
import { AIEmailDialog } from '@/components/ai-email-dialog'
import Link from 'next/link'
import { updateInvoiceStatus } from '@/lib/actions/invoices'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface InvoiceDetailProps {
    invoice: any
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const handleStatusChange = async (status: string) => {
        startTransition(async () => {
            const result = await updateInvoiceStatus(invoice.id, status)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Statut mis à jour : ${status}`)
                router.refresh()
            }
        })
    }

    const handlePrint = () => {
        window.print()
    }

    const handleCopyPaymentLink = () => {
        const baseUrl = window.location.origin
        const paymentLink = `${baseUrl}/pay/${invoice.id}`
        navigator.clipboard.writeText(paymentLink)
        toast.success('Lien de paiement copié !')
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
                        href="/dashboard/invoices"
                        className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-foreground">{invoice.number}</h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide
                ${invoice.status === 'draft' ? 'bg-muted text-muted-foreground' : ''}
                ${invoice.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : ''}
                ${invoice.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : ''}
                ${invoice.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : ''}
             `}>
                            {invoice.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer / PDF
                    </Button>

                    <AIEmailDialog type="invoice" id={invoice.id} />

                    {invoice.status !== 'paid' && (
                        <Button variant="outline" onClick={handleCopyPaymentLink}>
                            <Link2 className="w-4 h-4 mr-2" />
                            Lien de paiement
                        </Button>
                    )}

                    {invoice.status === 'draft' && (
                        <Button
                            variant="default"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleStatusChange('sent')}
                            disabled={isPending}
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Marquer Envoyée
                        </Button>
                    )}

                    {invoice.status === 'sent' && (
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleStatusChange('paid')}
                            disabled={isPending}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Enregistrer Paiement
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
                        <h1 className="text-4xl font-light text-foreground mb-2">FACTURE</h1>
                        <p className="font-mono text-muted-foreground">#{invoice.number}</p>
                        <div className="mt-4 text-sm text-muted-foreground">
                            <p><span className="font-medium">Date d'émission :</span> {formatDate(invoice.issueDate)}</p>
                            <p><span className="font-medium">Date d'échéance :</span> {formatDate(invoice.dueDate)}</p>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="border-t border-b border-border py-8 mb-12">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Facturé à</h3>
                            <div className="text-foreground font-medium">
                                {invoice.company ? (
                                    <>
                                        <p className="text-lg">{invoice.company.name}</p>
                                        <div className="text-sm text-muted-foreground font-normal mt-1 whitespace-pre-line">
                                            {invoice.company.address}
                                            {invoice.company.address && <br />}
                                            {invoice.company.postal_code} {invoice.company.city}
                                            {invoice.company.country && <br />}
                                            {invoice.company.country}
                                        </div>
                                    </>
                                ) : invoice.contact ? (
                                    <>
                                        <p className="text-lg">{invoice.contact.firstName} {invoice.contact.lastName}</p>
                                        <div className="text-sm text-muted-foreground font-normal mt-1">
                                            {invoice.contact.email}
                                            {invoice.contact.phone && <br />}
                                            {invoice.contact.phone}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-500">Client introuvable</p>
                                )}
                            </div>
                        </div>
                        <div>
                            {invoice.title && (
                                <>
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Objet</h3>
                                    <p className="text-foreground">{invoice.title}</p>
                                </>
                            )}
                            {/* Placeholder for payment info if needed */}
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
                            {invoice.items.map((item: any) => (
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
                            <span>{formatPrice(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>TVA (20%)</span>
                            <span>{formatPrice(invoice.vatAmount)}</span>
                        </div>
                        <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                            <span>Total TTC</span>
                            <span>{formatPrice(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-8 text-xs text-muted-foreground text-center">
                    <p className="mb-2">Facture acquittée.</p>
                    <p>KodaFlow - SAS au capital de 10 000 € - RCS Paris B 123 456 789 - TVA FR 12 345 678 901</p>
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
