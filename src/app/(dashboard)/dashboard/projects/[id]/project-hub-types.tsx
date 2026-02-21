import { Project, Company, Quote, Task, Invoice, Contract, TimeEntry, Contact } from '@/types/db'
import { TaskWithAssignee } from '@/lib/actions/tasks'
import { Clock, Pause, CheckCircle2, XCircle } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export type ProjectHubData = Project & {
  company: Company | null
  quote: (Quote & { items: any[]; company: Company | null; contact: Contact | null }) | null
  owner: { id: string; firstName: string | null; lastName: string | null } | null
  manager: { id: string; firstName: string | null; lastName: string | null } | null
  tasks: Task[]
  invoices: (Invoice & { company: Company | null; contact: Contact | null })[]
  contracts: (Contract & { company: Company | null; contact: Contact | null })[]
  timeEntries: (TimeEntry & {
    task: { id: string; title: string } | null
    user: { id: string; firstName: string | null; lastName: string | null } | null
  })[]
}

export type HubSummary = {
  totalMinutes: number
  billableMinutes: number
  totalHours: number
  billableHours: number
  invoiceTotal: number
  invoicePaid: number
  invoiceCount: number
  contractCount: number
  timeEntryCount: number
}

export type TasksByStatus = {
  todo: TaskWithAssignee[]
  in_progress: TaskWithAssignee[]
  review: TaskWithAssignee[]
  done: TaskWithAssignee[]
}

// ============================================
// CONSTANTS
// ============================================

export const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: 'Actif', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: <Clock className="w-3 h-3" /> },
  paused: { label: 'En pause', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', icon: <Pause className="w-3 h-3" /> },
  completed: { label: 'Terminé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground', icon: <XCircle className="w-3 h-3" /> },
}

export const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export const columns = [
  { id: 'todo', title: 'À faire', color: '#9ca3af' },
  { id: 'in_progress', title: 'En cours', color: '#3b82f6' },
  { id: 'review', title: 'En revue', color: '#f59e0b' },
  { id: 'done', title: 'Terminé', color: '#22c55e' },
]

export const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  sent: { label: 'Envoyée', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  paid: { label: 'Payée', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  partial: { label: 'Partiel', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  overdue: { label: 'En retard', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  cancelled: { label: 'Annulée', color: 'bg-muted text-muted-foreground' },
}

export const contractStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-muted text-muted-foreground' },
  sent: { label: 'Envoyé', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  signed: { label: 'Signé', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  expired: { label: 'Expiré', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  cancelled: { label: 'Annulé', color: 'bg-muted text-muted-foreground' },
}

// ============================================
// HELPERS
// ============================================

export const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export const formatDate = (date: string | Date | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}
