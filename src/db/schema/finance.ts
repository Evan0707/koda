import { pgTable, uuid, text, timestamp, jsonb, integer, date } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations, users } from './core'

// ============================================
// EXPENSE CATEGORIES
// ============================================
export const expenseCategories = pgTable('expense_categories', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 color: text('color').default('#6B7280'),
 icon: text('icon'),

 // For accounting
 accountCode: text('account_code'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// EXPENSES
// ============================================
export const expenses = pgTable('expenses', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 categoryId: uuid('category_id').references(() => expenseCategories.id),
 createdById: uuid('created_by_id').references(() => users.id),

 description: text('description').notNull(),

 amount: integer('amount').notNull(), // In cents
 currency: text('currency').default('EUR'),
 vatAmount: integer('vat_amount').default(0),
 vatRate: integer('vat_rate').default(20),

 date: date('date').notNull(),

 // Receipt
 receiptUrl: text('receipt_url'),

 // Status
 status: text('status').default('pending'), // pending, approved, rejected

 // For reconciliation
 isReconciled: text('is_reconciled').default('false'),
 bankTransactionId: text('bank_transaction_id'),

 metadata: jsonb('metadata').default({}),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// BANK ACCOUNTS
// ============================================
export const bankAccounts = pgTable('bank_accounts', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 bankName: text('bank_name'),

 iban: text('iban'),
 bic: text('bic'),

 balance: integer('balance').default(0), // In cents
 currency: text('currency').default('EUR'),

 isDefault: text('is_default').default('false'),

 // For bank sync
 plaidAccessToken: text('plaid_access_token'),
 lastSyncAt: timestamp('last_sync_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================
export const expensesRelations = relations(expenses, ({ one }) => ({
 organization: one(organizations, {
  fields: [expenses.organizationId],
  references: [organizations.id],
 }),
 category: one(expenseCategories, {
  fields: [expenses.categoryId],
  references: [expenseCategories.id],
 }),
 createdBy: one(users, {
  fields: [expenses.createdById],
  references: [users.id],
 }),
}))
