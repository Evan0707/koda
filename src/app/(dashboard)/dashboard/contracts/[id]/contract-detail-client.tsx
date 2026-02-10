'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Send,
  User,
  Building2,
  Printer,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { updateContractStatus } from '@/lib/actions/contracts'
import { useConfirm } from '@/components/confirm-dialog'

type Contract = {
  id: string
  title: string
  content: string
  status: string | null
  version: number | null
  signedAt: Date | null
  effectiveDate: Date | null
  expirationDate: Date | null
  createdAt: Date
  updatedAt: Date
  company: { id: string; name: string } | null
  contact: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null
  createdBy: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: Clock },
  sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Send },
  signed: { label: 'Signé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
  expired: { label: 'Expiré', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  cancelled: { label: 'Annulé', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: Clock },
}

export default function ContractDetailClient({
  contract,
  initialContent,
}: {
  contract: Contract
  initialContent: string
}) {
  const [status, setStatus] = useState(contract.status || 'draft')
  const [isPending, startTransition] = useTransition()
  const { confirm } = useConfirm()

  const statusInfo = statusConfig[status] || statusConfig.draft
  const StatusIcon = statusInfo.icon

  const handleStatusChange = async (newStatus: string) => {
    startTransition(async () => {
      const result = await updateContractStatus(contract.id, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        setStatus(newStatus)
        toast.success('Statut mis à jour')
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  // Placeholder for PDF download (would typically use a library like @react-pdf/renderer or jsPDF)
  const handleDownloadPDF = () => {
    handlePrint() // Fallback to print for now
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/contracts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              {contract.title}
              <Badge className={statusInfo.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {contract.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {contract.company.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Créé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          {/* Actions based on status */}
          {status === 'draft' && (
            <>
              <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </Link>
              <Button onClick={() => handleStatusChange('sent')} disabled={isPending}>
                <Send className="w-4 h-4 mr-2" />
                Marquer envoyé
              </Button>
            </>
          )}
          {status === 'sent' && (
            <Button
              onClick={() => handleStatusChange('signed')}
              className="bg-green-600 hover:bg-green-700"
              disabled={isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marquer signé
            </Button>
          )}
        </div>
      </div>

      {/* Contract Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="font-medium text-foreground mt-1">
                  {contract.contact
                    ? `${contract.contact.firstName} ${contract.contact.lastName}`
                    : 'Non défini'}
                </p>
                {contract.contact?.email && (
                  <p className="text-sm text-muted-foreground">{contract.contact.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dates clés</p>
                <div className="space-y-1 mt-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Effet : </span>
                    {contract.effectiveDate
                      ? new Date(contract.effectiveDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Expiration : </span>
                    {contract.expirationDate
                      ? new Date(contract.expirationDate).toLocaleDateString('fr-FR')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Signature</p>
                {status === 'signed' ? (
                  <div className="mt-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Signé</p>
                    {contract.signedAt && (
                      <p className="text-sm text-muted-foreground">
                        le {new Date(contract.signedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">En attente de signature</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Content (Paper View) */}
      <div className="bg-card shadow-lg rounded-none md:rounded-lg p-8 md:p-16 min-h-[800px] print:shadow-none print:p-0">
        {/* Print Header (Only visible when printing) */}
        <div className="hidden print:block mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold mb-2">{contract.title}</h1>
          <p className="text-muted-foreground">
            Date : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="prose prose-indigo max-w-none whitespace-pre-wrap font-serif">
          {initialContent}
        </div>

        {/* Signature Section */}
        <div className="mt-16 pt-8 border-t break-inside-avoid">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <p className="font-bold mb-8">Pour {contract.company?.name || 'Le Client'}</p>
              <div className="h-24 border-b border-dashed border-gray-300"></div>
              <p className="text-sm text-gray-500 mt-2">
                {contract.contact ? `${contract.contact.firstName} ${contract.contact.lastName}` : 'Nom et Signature'}
              </p>
            </div>
            <div>
              <p className="font-bold mb-8">Pour KodaFlow</p>
              <div className="h-24 border-b border-dashed border-gray-300"></div>
              <p className="text-sm text-gray-500 mt-2">
                {contract.createdBy ? `${contract.createdBy.firstName} ${contract.createdBy.lastName}` : 'Nom et Signature'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
