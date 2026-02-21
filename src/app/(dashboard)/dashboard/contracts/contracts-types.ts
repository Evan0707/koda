import { Clock, Send, CheckCircle, XCircle } from 'lucide-react'

export type Contract = {
  id: string
  title: string
  content: string
  status: string | null
  version: number | null
  signedAt: Date | null
  effectiveDate: Date | null
  expirationDate: Date | null
  createdAt: Date
  company: { id: string; name: string } | null
  contact: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null
  template: { id: string; name: string } | null
}

export type Template = {
  id: string
  name: string
  description: string | null
  content: string
  category: string | null
  createdAt: Date
}

export type Company = {
  id: string
  name: string
}

export type Contact = {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  companyId: string | null
}

export const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground', icon: Clock },
  sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Send },
  signed: { label: 'Signé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle },
  expired: { label: 'Expiré', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  cancelled: { label: 'Annulé', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: XCircle },
}

export const categoryLabels: Record<string, string> = {
  nda: 'NDA',
  freelance: 'Freelance',
  service: 'Prestation',
  custom: 'Personnalisé',
}
