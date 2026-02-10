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
