import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { organizations } from './core'

// Notifications moved to ./collaboration.ts

// ============================================
// AUTOMATION RULES
// ============================================
export const automationRules = pgTable('automation_rules', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 name: text('name').notNull(),
 description: text('description'),

 // Trigger
 triggerType: text('trigger_type').notNull(), // invoice_overdue, quote_signed, task_completed, etc.
 triggerConditions: jsonb('trigger_conditions').default({}),

 // Actions
 actions: jsonb('actions').default([]),

 isActive: boolean('is_active').default(true),

 createdAt: timestamp('created_at').defaultNow().notNull(),
 updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// AUTOMATION LOGS
// ============================================
export const automationLogs = pgTable('automation_logs', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
 ruleId: uuid('rule_id').references(() => automationRules.id),

 status: text('status').notNull(), // success, failed, skipped

 triggerData: jsonb('trigger_data').default({}),
 actionsExecuted: jsonb('actions_executed').default([]),
 error: text('error'),

 executedAt: timestamp('executed_at').defaultNow().notNull(),
})

// ============================================
// AI SUGGESTIONS
// ============================================
export const aiSuggestions = pgTable('ai_suggestions', {
 id: uuid('id').primaryKey().defaultRandom(),
 organizationId: uuid('organization_id').references(() => organizations.id).notNull(),

 type: text('type').notNull(), // price_suggestion, content_generation, categorization

 // What triggered it
 contextType: text('context_type'), // quote, invoice, expense
 contextId: uuid('context_id'),

 // The suggestion
 suggestion: jsonb('suggestion').notNull(),
 confidence: text('confidence'), // low, medium, high

 // User feedback
 status: text('status').default('pending'), // pending, accepted, rejected
 userFeedback: text('user_feedback'),

 createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================
// Relations moved to ./relations.ts
