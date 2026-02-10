import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { organizations, users } from './core'

// ============================================
// AUDIT LOGS
// ============================================
export const auditLogs = pgTable('audit_logs', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id),
 userId: uuid('user_id').references(() => users.id),

 // Action details
 action: text('action').notNull(), // e.g., 'quote.created', 'invoice.sent'
 entityType: text('entity_type').notNull(), // 'quote', 'invoice', 'contact', etc.
 entityId: uuid('entity_id'), // ID of the affected entity

 // Additional context
 metadata: jsonb('metadata').default({}), // old/new values, extra info
 ipAddress: text('ip_address'),
 userAgent: text('user_agent'),

 // Timestamp
 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Action types for reference
export const AUDIT_ACTIONS = {
 // Quotes
 QUOTE_CREATED: 'quote.created',
 QUOTE_UPDATED: 'quote.updated',
 QUOTE_DELETED: 'quote.deleted',
 QUOTE_SENT: 'quote.sent',
 QUOTE_SIGNED: 'quote.signed',

 // Invoices
 INVOICE_CREATED: 'invoice.created',
 INVOICE_UPDATED: 'invoice.updated',
 INVOICE_DELETED: 'invoice.deleted',
 INVOICE_SENT: 'invoice.sent',
 INVOICE_PAID: 'invoice.paid',

 // Contacts
 CONTACT_CREATED: 'contact.created',
 CONTACT_UPDATED: 'contact.updated',
 CONTACT_DELETED: 'contact.deleted',

 // Companies
 COMPANY_CREATED: 'company.created',
 COMPANY_UPDATED: 'company.updated',
 COMPANY_DELETED: 'company.deleted',

 // Projects
 PROJECT_CREATED: 'project.created',
 PROJECT_UPDATED: 'project.updated',
 PROJECT_DELETED: 'project.deleted',

 // Contracts
 CONTRACT_CREATED: 'contract.created',
 CONTRACT_UPDATED: 'contract.updated',
 CONTRACT_DELETED: 'contract.deleted',
 CONTRACT_SIGNED: 'contract.signed',

 // Settings
 PROFILE_UPDATED: 'settings.profile_updated',
 PASSWORD_CHANGED: 'settings.password_changed',
 GMAIL_CONNECTED: 'settings.gmail_connected',
 GMAIL_DISCONNECTED: 'settings.gmail_disconnected',

 // Auth
 USER_LOGIN: 'auth.login',
 USER_LOGOUT: 'auth.logout',
} as const
