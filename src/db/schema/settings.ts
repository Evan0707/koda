import { pgTable, uuid, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { organizations } from './core'

// ============================================
// DOCUMENT SEQUENCES (NUMBERING)
// ============================================
export const documentSequences = pgTable('document_sequences', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 type: text('type').notNull(), // quote, invoice, contract

 prefix: text('prefix').default(''),
 suffix: text('suffix').default(''),

 currentNumber: integer('current_number').default(1),

 // Format: {prefix}{year}-{number:padded}{suffix}
 // Example: DEV-2026-0001
 paddingLength: integer('padding_length').default(4),
 includeYear: boolean('include_year').default(true),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// EMAIL CONFIGS
// ============================================
export const emailConfigs = pgTable('email_configs', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 type: text('type').notNull(), // quote_sent, invoice_sent, invoice_reminder, etc.

 subject: text('subject').notNull(),
 body: text('body').notNull(), // HTML with variables

 isActive: boolean('is_active').default(true),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// WEBHOOKS
// ============================================
export const webhooks = pgTable('webhooks', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 url: text('url').notNull(),
 secret: text('secret'),

 events: jsonb('events').default([]), // Array of event types

 isActive: boolean('is_active').default(true),

 lastTriggeredAt: timestamp('last_triggered_at'),
 failureCount: integer('failure_count').default(0),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// API KEYS
// ============================================
export const apiKeys = pgTable('api_keys', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 keyHash: text('key_hash').notNull(), // Hashed key
 keyPrefix: text('key_prefix').notNull(), // First few chars for identification

 permissions: jsonb('permissions').default([]),

 lastUsedAt: timestamp('last_used_at'),
 expiresAt: timestamp('expires_at'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// ACTIVITY LOGS (AUDIT)
// ============================================
export const activityLogs = pgTable('activity_logs', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 actorType: text('actor_type').notNull(), // user, system, automation
 actorId: uuid('actor_id'),

 action: text('action').notNull(), // created, updated, deleted, sent, signed, etc.

 resourceType: text('resource_type').notNull(),
 resourceId: uuid('resource_id').notNull(),

 changes: jsonb('changes').default({}), // Before/after for updates
 metadata: jsonb('metadata').default({}),

 ipAddress: text('ip_address'),
 userAgent: text('user_agent'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================
export const documentSequencesRelations = relations(documentSequences, ({ one }) => ({
 organization: one(organizations, {
  fields: [documentSequences.organizationId],
  references: [organizations.id],
 }),
}))

export const webhooksRelations = relations(webhooks, ({ one }) => ({
 organization: one(organizations, {
  fields: [webhooks.organizationId],
  references: [organizations.id],
 }),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
 organization: one(organizations, {
  fields: [activityLogs.organizationId],
  references: [organizations.id],
 }),
}))
