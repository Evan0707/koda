import { InferSelectModel } from 'drizzle-orm'
import { organizations, users } from '@/db/schema/core'
import { companies, contacts, opportunities, activities, pipelineStages } from '@/db/schema/crm'
import { products, quotes, quoteItems, invoices, invoiceItems, payments } from '@/db/schema/billing'
import { projects, tasks, cycles, timeEntries } from '@/db/schema/projects'

// Core
export type Organization = InferSelectModel<typeof organizations>
export type User = InferSelectModel<typeof users>

// CRM
export type Company = InferSelectModel<typeof companies>
export type Contact = InferSelectModel<typeof contacts>
export type Opportunity = InferSelectModel<typeof opportunities>
export type Activity = InferSelectModel<typeof activities>
export type PipelineStage = InferSelectModel<typeof pipelineStages>

// Billing
export type Product = InferSelectModel<typeof products>
export type Quote = InferSelectModel<typeof quotes>
export type QuoteItem = InferSelectModel<typeof quoteItems>
export type Invoice = InferSelectModel<typeof invoices>
export type InvoiceItem = InferSelectModel<typeof invoiceItems>
export type Payment = InferSelectModel<typeof payments>

// Projects
export type Project = InferSelectModel<typeof projects>
export type Task = InferSelectModel<typeof tasks>
export type Cycle = InferSelectModel<typeof cycles>
export type TimeEntry = InferSelectModel<typeof timeEntries>

// Composite Types (With Relations)
export type InvoiceWithDetails = Invoice & {
 company: Company | null
 contact: Contact | null
 items: InvoiceItem[]
 payments?: Payment[]
}

export type QuoteWithDetails = Quote & {
 company: Company | null
 contact: Contact | null
 items: QuoteItem[]
}

export type ProjectWithDetails = Project & {
 company: Company | null
 contact: Contact | null
 quote: Quote | null
}

// ===========================================
// Public Page Types (for unauthenticated views)
// ===========================================

/** Organization info shown on public pages */
export type PublicOrganization = {
 name: string
 address: string | null
 city: string | null
 postalCode: string | null
 country: string | null
 siret: string | null
 vatNumber: string | null
 logoUrl: string | null
}

/** Contact info shown on public pages */
export type PublicContact = {
 name: string
 email: string | null
 companyName: string | null
}

/** Line item for public invoices/quotes */
export type PublicLineItem = {
 description: string | null
 quantity: number
 unitPrice: number
 total: number
}

/** Invoice data for public payment page */
export type PublicInvoice = {
 id: string
 number: string
 issueDate: Date
 dueDate: Date | null
 status: string | null
 subtotal: number
 vatAmount: number
 total: number
 notes: string | null
 items: PublicLineItem[]
 contact: PublicContact | null
 organization: PublicOrganization
}

/** Quote data for public signature page */
export type PublicQuote = {
 id: string
 number: string
 status: string
 title: string | null
 introduction: string | null
 terms: string | null
 notes: string | null
 issueDate: string | null
 validUntil: string | null
 subtotal: number | null
 vatAmount: number | null
 total: number | null
 discount: number | null
 currency: string | null
 depositPercent: number | null
 depositRequired: boolean | null
 signedAt: Date | null
 items: { description: string; quantity: number; unitPrice: number; total: number }[]
 contact: PublicContact | null
 organization: PublicOrganization
}
