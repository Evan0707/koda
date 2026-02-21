import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'
import { companies, contacts } from './crm'
import { projects } from './projects'

// ============================================
// PRODUCTS / SERVICES
// ============================================
export const products = pgTable('products', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 description: text('description'),

 unitPrice: integer('unit_price').notNull(), // In cents
 currency: text('currency').default('EUR'),
 unit: text('unit').default('unit'), // hour, day, unit, fixed

 vatRate: integer('vat_rate').default(20), // 20 = 20%

 isActive: boolean('is_active').default(true),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// QUOTES (DEVIS)
// ============================================
export const quotes = pgTable('quotes', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 companyId: uuid('company_id').references(() => companies.id),
 contactId: uuid('contact_id').references(() => contacts.id),
 createdById: uuid('created_by_id').references(() => users.id),

 // Numbering
 number: text('number').notNull(),

 // Status
 status: text('status').default('draft').notNull(), // draft, sent, viewed, signed, rejected, expired

 // Content
 title: text('title'),
 introduction: text('introduction'),
 terms: text('terms'),
 notes: text('notes'),

 // Amounts (in cents)
 subtotal: integer('subtotal').default(0),
 vatAmount: integer('vat_amount').default(0),
 total: integer('total').default(0),
 discount: integer('discount').default(0),

 currency: text('currency').default('EUR'),

 // Dates
 issueDate: date('issue_date'),
 validUntil: date('valid_until'),

 // Signature
 signedAt: timestamp('signed_at'),
 signatureData: jsonb('signature_data'), // Signature image, signer info

 // Deposit
 depositPercent: integer('deposit_percent').default(30),
 depositRequired: boolean('deposit_required').default(true),

 // Tracking
 viewedAt: timestamp('viewed_at'),
 viewCount: integer('view_count').default(0),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// QUOTE LINE ITEMS
// ============================================
export const quoteItems = pgTable('quote_items', {
 id: uuid('id').primaryKey().defaultRandom(),
 quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }).notNull(),
 productId: uuid('product_id').references(() => products.id),

 position: integer('position').notNull(),

 description: text('description').notNull(),
 quantity: integer('quantity').default(1),
 unitPrice: integer('unit_price').notNull(), // In cents
 vatRate: integer('vat_rate').default(20),

 total: integer('total').notNull(), // quantity * unitPrice

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// INVOICES
// ============================================
export const invoices = pgTable('invoices', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 companyId: uuid('company_id').references(() => companies.id),
 contactId: uuid('contact_id').references(() => contacts.id),
 quoteId: uuid('quote_id').references(() => quotes.id),
 projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
 createdById: uuid('created_by_id').references(() => users.id),

 // Numbering
 number: text('number').notNull(),

 // Status
 status: text('status').default('draft').notNull(), // draft, sent, paid, partial, overdue, cancelled

 // Type
 type: text('type').default('invoice'), // invoice, deposit, credit_note

 // Content
 title: text('title'),
 notes: text('notes'),

 // Amounts (in cents)
 subtotal: integer('subtotal').default(0),
 vatAmount: integer('vat_amount').default(0),
 total: integer('total').default(0),
 paidAmount: integer('paid_amount').default(0),

 currency: text('currency').default('EUR'),

 // Dates
 issueDate: date('issue_date'),
 dueDate: date('due_date'),
 paidAt: timestamp('paid_at'),

 // Reminders
 lastReminderAt: timestamp('last_reminder_at'),
 reminderCount: integer('reminder_count').default(0),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
 deletedAt: timestamp('deleted_at'),
})

// ============================================
// INVOICE LINE ITEMS
// ============================================
export const invoiceItems = pgTable('invoice_items', {
 id: uuid('id').primaryKey().defaultRandom(),
 invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }).notNull(),
 productId: uuid('product_id').references(() => products.id),

 position: integer('position').notNull(),

 description: text('description').notNull(),
 quantity: integer('quantity').default(1),
 unitPrice: integer('unit_price').notNull(),
 vatRate: integer('vat_rate').default(20),

 total: integer('total').notNull(),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// PAYMENTS
// ============================================
export const payments = pgTable('payments', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),

 amount: integer('amount').notNull(), // In cents
 currency: text('currency').default('EUR'),

 method: text('method').notNull(), // card, bank_transfer, cash, check
 status: text('status').default('pending'), // pending, succeeded, failed, refunded
 reference: text('reference'),

 // Stripe
 stripePaymentIntentId: text('stripe_payment_intent_id'),
 stripeChargeId: text('stripe_charge_id'),

 paidAt: timestamp('paid_at'),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations moved to ./relations.ts
