// Export utilities for accounting data (CSV and FEC formats)

import { Invoice } from '@/types/db'

/**
 * Format date for FEC (YYYYMMDD)
 */
function formatDateFEC(dateStr: string | Date | null): string {
 if (!dateStr) return ''
 const date = new Date(dateStr)
 const year = date.getFullYear()
 const month = String(date.getMonth() + 1).padStart(2, '0')
 const day = String(date.getDate()).padStart(2, '0')
 return `${year}${month}${day}`
}

/**
 * Format amount for export (convert cents to euros with 2 decimals)
 */
function formatAmount(cents: number | null): string {
 if (cents === null || cents === undefined) return '0.00'
 return (cents / 100).toFixed(2)
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | null | undefined): string {
 if (value === null || value === undefined) return ''
 const str = String(value)
 if (str.includes(',') || str.includes('"') || str.includes('\n')) {
  return `"${str.replace(/"/g, '""')}"`
 }
 return str
}

export type InvoiceExportData = {
 id: string
 number: string
 status: string
 issueDate: string | null
 dueDate: string | null
 paidAt: Date | null
 subtotal: number | null
 vatAmount: number | null
 total: number | null
 paidAmount: number | null
 currency: string | null
 contact?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
 company?: { name?: string | null } | null
}

/**
 * Generate CSV export of invoices
 */
export function generateInvoicesCSV(invoices: InvoiceExportData[]): string {
 const headers = [
  'Numéro',
  'Client',
  'Email',
  'Date Émission',
  'Date Échéance',
  'Date Paiement',
  'Montant HT',
  'TVA',
  'Total TTC',
  'Montant Payé',
  'Devise',
  'Statut',
 ]

 const rows = invoices.map(inv => [
  escapeCSV(inv.number),
  escapeCSV(inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || 'N/A'),
  escapeCSV(inv.contact?.email || ''),
  inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('fr-FR') : '',
  inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR') : '',
  inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('fr-FR') : '',
  formatAmount(inv.subtotal),
  formatAmount(inv.vatAmount),
  formatAmount(inv.total),
  formatAmount(inv.paidAmount),
  inv.currency || 'EUR',
  inv.status,
 ])

 return [
  headers.join(','),
  ...rows.map(row => row.join(','))
 ].join('\n')
}

/**
 * Generate FEC (Fichier des Écritures Comptables) export
 * French legal format for accounting data
 * 
 * FEC columns:
 * JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum, CompteLib,
 * CompAuxNum, CompAuxLib, PieceRef, PieceDate, EcritureLib, Debit, Credit,
 * EcritureLet, DateLet, ValidDate, Montantdevise, Idevise
 */
export function generateInvoicesFEC(invoices: InvoiceExportData[], companyName: string = 'Entreprise'): string {
 const headers = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
 ]

 const rows: string[][] = []
 let ecritureNum = 1

 invoices.forEach(inv => {
  const clientName = inv.company?.name || `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`.trim() || 'Client'
  const issueDate = formatDateFEC(inv.issueDate)
  const total = inv.total || 0
  const vatAmount = inv.vatAmount || 0
  const subtotal = inv.subtotal || 0

  // Ligne client (débit)
  rows.push([
   'VE', // Journal Ventes
   'Journal des Ventes',
   String(ecritureNum),
   issueDate,
   '411000', // Compte client
   'Clients',
   '', // CompAuxNum
   clientName,
   inv.number,
   issueDate,
   `Facture ${inv.number}`,
   formatAmount(total).replace('.', ','), // Débit
   '0,00', // Crédit
   '',
   '',
   issueDate,
   formatAmount(total).replace('.', ','),
   inv.currency || 'EUR',
  ])

  // Ligne TVA (crédit)
  if (vatAmount > 0) {
   rows.push([
    'VE',
    'Journal des Ventes',
    String(ecritureNum),
    issueDate,
    '445710', // TVA collectée
    'TVA Collectée',
    '',
    '',
    inv.number,
    issueDate,
    `TVA Facture ${inv.number}`,
    '0,00',
    formatAmount(vatAmount).replace('.', ','),
    '',
    '',
    issueDate,
    formatAmount(vatAmount).replace('.', ','),
    inv.currency || 'EUR',
   ])
  }

  // Ligne produit/service (crédit)
  rows.push([
   'VE',
   'Journal des Ventes',
   String(ecritureNum),
   issueDate,
   '706000', // Prestations de services
   'Prestations de services',
   '',
   '',
   inv.number,
   issueDate,
   `Prestation Facture ${inv.number}`,
   '0,00',
   formatAmount(subtotal).replace('.', ','),
   '',
   '',
   issueDate,
   formatAmount(subtotal).replace('.', ','),
   inv.currency || 'EUR',
  ])

  ecritureNum++
 })

 return [
  headers.join('\t'),
  ...rows.map(row => row.join('\t'))
 ].join('\n')
}

/**
 * Get filename for export
 */
export function getExportFilename(type: 'csv' | 'fec', startDate?: string, endDate?: string, prefix: string = 'factures'): string {
 const today = new Date().toISOString().split('T')[0]
 const dateRange = startDate && endDate ? `${startDate}_${endDate}` : today

 if (type === 'fec') {
  return `FEC_${dateRange}.txt`
 }
 return `${prefix}_${dateRange}.csv`
}

// ============================================
// QUOTE EXPORT
// ============================================
export type QuoteExportData = {
 id: string
 number: string
 status: string
 title: string | null
 issueDate: string | null
 validUntil: string | null
 signedAt: Date | null
 subtotal: number | null
 vatAmount: number | null
 total: number | null
 currency: string | null
 contact?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null
 company?: { name?: string | null } | null
}

export function generateQuotesCSV(quotes: QuoteExportData[]): string {
 const headers = [
  'Numéro',
  'Titre',
  'Client',
  'Email',
  'Date Émission',
  'Valide Jusqu\'au',
  'Date Signature',
  'Montant HT',
  'TVA',
  'Total TTC',
  'Devise',
  'Statut',
 ]

 const rows = quotes.map(q => [
  escapeCSV(q.number),
  escapeCSV(q.title),
  escapeCSV(q.company?.name || `${q.contact?.firstName || ''} ${q.contact?.lastName || ''}`.trim() || 'N/A'),
  escapeCSV(q.contact?.email || ''),
  q.issueDate ? new Date(q.issueDate).toLocaleDateString('fr-FR') : '',
  q.validUntil ? new Date(q.validUntil).toLocaleDateString('fr-FR') : '',
  q.signedAt ? new Date(q.signedAt).toLocaleDateString('fr-FR') : '',
  formatAmount(q.subtotal),
  formatAmount(q.vatAmount),
  formatAmount(q.total),
  q.currency || 'EUR',
  q.status,
 ])

 return [
  headers.join(','),
  ...rows.map(row => row.join(','))
 ].join('\n')
}

// ============================================
// EXPENSE EXPORT
// ============================================
export type ExpenseExportData = {
 id: string
 description: string | null
 amount: number | null
 currency: string | null
 vatAmount: number | null
 vatRate: number | null
 date: string | null
 status: string | null
 category?: { name?: string | null } | null
}

export function generateExpensesCSV(expenses: ExpenseExportData[]): string {
 const headers = [
  'Description',
  'Catégorie',
  'Date',
  'Montant HT',
  'TVA',
  'Taux TVA (%)',
  'Devise',
  'Statut',
 ]

 const rows = expenses.map(e => [
  escapeCSV(e.description),
  escapeCSV(e.category?.name || 'Non catégorisé'),
  e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '',
  formatAmount(e.amount),
  formatAmount(e.vatAmount),
  String(e.vatRate ?? 20),
  e.currency || 'EUR',
  e.status || '',
 ])

 return [
  headers.join(','),
  ...rows.map(row => row.join(','))
 ].join('\n')
}

// ============================================
// TIME ENTRY EXPORT
// ============================================
export type TimeEntryExportData = {
 id: string
 description: string | null
 duration: number | null
 date: string | null
 isBillable: boolean | null
 hourlyRate: number | null
 project?: { name?: string | null } | null
 task?: { title?: string | null } | null
}

export function generateTimeEntriesCSV(entries: TimeEntryExportData[]): string {
 const headers = [
  'Date',
  'Projet',
  'Tâche',
  'Description',
  'Durée (heures)',
  'Facturable',
  'Taux Horaire (€)',
  'Montant (€)',
 ]

 const rows = entries.map(e => {
  const hours = (e.duration ?? 0) / 60
  const rate = (e.hourlyRate ?? 0) / 100
  const amount = hours * rate
  return [
   e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '',
   escapeCSV(e.project?.name || 'Sans projet'),
   escapeCSV(e.task?.title || ''),
   escapeCSV(e.description),
   hours.toFixed(2),
   e.isBillable ? 'Oui' : 'Non',
   rate.toFixed(2),
   amount.toFixed(2),
  ]
 })

 return [
  headers.join(','),
  ...rows.map(row => row.join(','))
 ].join('\n')
}
